import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import patientApi from "../../api/patientApi";
import appointmentApi from "../../api/appointmentApi";
import doctorApi from "../../api/doctorApi";
import conversationApi from "../../api/conversationApi";
import messageApi from "../../api/messageApi";
import fileUploadApi from "../../api/fileUploadApi";
import userApi from "../../api/userApi";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Cookies from "js-cookie";
import config from "../../config/config";
import {
  Search,
  Send,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  User,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";

// UI components
const Button = (props) => (
  <button
    {...props}
    className={`btn ${props.variant === "outline" ? "btn-outline-primary" : "btn-primary"
      } ${props.className || ""}`}
  >
    {props.children}
  </button>
);

const Input = (props) => (
  <input {...props} className={`form-control ${props.className || ""}`} />
);

const Avatar = ({ src, alt, children, size = 40, online = false }) => (
  <div className="position-relative">
    <div
      className="avatar rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        border: "3px solid #fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          className="fw-bold text-white"
          style={{ fontSize: `${size * 0.4}px` }}
        >
          {children}
        </span>
      )}
    </div>
    {online && (
      <div
        className="position-absolute bg-success rounded-circle"
        style={{
          width: 12,
          height: 12,
          bottom: 2,
          right: 2,
          border: "2px solid white",
        }}
      />
    )}
  </div>
);

function PatientMessages() {
  const [searchParams] = useSearchParams();
  const selectedDoctorId = searchParams.get("doctorId");
  const urlPatientId = searchParams.get("patientId");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // local preview URL
  const [pendingFile, setPendingFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const seenMessageIdsRef = React.useRef(new Set());
  const lastWsMessageAtRef = React.useRef(0);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [menuOpenMessageId, setMenuOpenMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

  const markConversationAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    try {
      await messageApi.markMessagesAsRead(conversationId, currentUserId);
      setMessages(prev => prev.map(msg =>
        Number(msg.senderId) === Number(currentUserId) ? msg : { ...msg, isRead: true }
      ));
      setDoctors(prev => prev.map(d =>
        selectedDoctor && d.doctorId === selectedDoctor.doctorId
          ? { ...d, unreadCount: 0 }
          : d
      ));
    } catch (e) {
      console.error("Failed to mark conversation as read:", e);
    }
  }, [conversationId, currentUserId, setMessages, setDoctors, selectedDoctor]);

  const mergeUniqueMessages = useCallback((existing, incomingList) => {
    const toKey = (msg) => {
      const id = msg.messageId ?? msg.id;
      if (id !== undefined && id !== null) {
        return `id-${id}`;
      }
      const sender = msg.senderId ?? "unknown";
      const timestamp = msg.createdAt || msg.sentAt || msg._arrivalAt || "";
      const content = msg.content || "";
      return `fallback-${sender}-${timestamp}-${content}`;
    };

    const next = [...existing];
    const indexByKey = new Map();
    next.forEach((msg, idx) => {
      indexByKey.set(toKey(msg), idx);
    });

    incomingList.forEach((msg) => {
      const key = toKey(msg);
      if (indexByKey.has(key)) {
        const idx = indexByKey.get(key);
        next[idx] = { ...next[idx], ...msg };
      } else {
        const enriched = { ...msg, _arrivalAt: Date.now() };
        next.push(enriched);
        indexByKey.set(key, next.length - 1);
        const id = msg.messageId ?? msg.id;
        if (id !== undefined && id !== null) {
          seenMessageIdsRef.current.add(String(id));
        }
      }
    });

    return next;
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById("messages-container");
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  // Chuẩn hoá URL ảnh đính kèm: nếu backend trả path tương đối (/uploads/..)
  // thì thêm origin http://localhost:8080, còn nếu đã absolute thì giữ nguyên
  const resolveAttachmentUrl = useCallback((url) => {
    if (!url) return url;
    try {
      // absolute URL -> trả lại luôn
      const u = new URL(url);
      return u.href;
    } catch {
      // relative path -> prefix server origin (không /api)
      const base = window.location.origin.replace(/:\d+$/, ':8080');
      return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
    }
  }, []);

  // Get current user from localStorage (memoized)
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  // Fetch patientId and currentUserId
  useEffect(() => {
    const fetchPatientId = async () => {
      const userId = Cookies.get("userId") || currentUser?.id;
      if (userId) {
        setCurrentUserId(userId);
        // Thử lấy patientId từ user object hoặc sử dụng userId trực tiếp
        try {
          // Kiểm tra xem user object có chứa patientId không
          if (currentUser?.patientId) {
            setPatientId(currentUser.patientId);
            return;
          }
          
          // Nếu không có, thử lấy từ API users với patient info
          const res = await userApi.getAllUsersWithPatientInfo();
          const usersWithPatientInfo = res.data || res;
          const currentUserWithPatientInfo = usersWithPatientInfo.find(u => u.id === userId);
          
          if (currentUserWithPatientInfo?.patientId) {
            setPatientId(currentUserWithPatientInfo.patientId);
          } else {
            // Fallback: sử dụng userId làm patientId nếu không tìm thấy
            console.log("No patientId found, using userId as patientId:", userId);
            setPatientId(userId);
          }
        } catch (err) {
          console.error("Error fetching patientId:", err);
          // Fallback: sử dụng userId làm patientId
          setPatientId(userId);
        }
      }
    };
    fetchPatientId();
  }, [currentUser]);

  // Fetch doctors with appointments
  const fetchDoctors = useCallback(async () => {
    if (!patientId && !currentUserId) return;

    // Tránh flicker: chỉ bật loading trong lần tải đầu
    if (doctors.length === 0) setLoading(true);
    try {
      let appointmentsRes;
      
      // Thử lấy appointments bằng patientId trước, nếu không có thì dùng currentUserId
      const targetPatientId = patientId || currentUserId;
      if (targetPatientId) {
        try {
          appointmentsRes = await appointmentApi.getAppointmentsByPatient(targetPatientId);
          console.log(`✅ Loaded appointments for patient ${targetPatientId}:`, appointmentsRes.data?.length || 0);
        } catch (err) {
          console.log("Failed to get appointments by patientId, trying alternative approach:", err);
          appointmentsRes = null;
        }
      }
      
      // Nếu không có appointments, không hiển thị doctors nào
      if (!appointmentsRes || appointmentsRes.data.length === 0) {
        console.log("❌ No appointments found for patient", targetPatientId, "- no doctors to display");
        console.log("Appointments response:", appointmentsRes);
        setDoctors([]);
        return;
      }
      
      console.log("✅ Found appointments:", appointmentsRes.data.length);
      
      // Lấy danh sách doctor IDs từ appointments
      const doctorIds = [...new Set(
        appointmentsRes.data
          .filter(appointment => appointment.doctorId !== null)
          .map(appointment => appointment.doctorId)
      )];
      
      console.log("✅ Doctor IDs from appointments:", doctorIds);

      // Lấy thông tin chi tiết của từng doctor
      const doctorsWithDetails = await Promise.all(
        doctorIds.map(async (doctorId) => {
          try {
            const doctorRes = await doctorApi.getDoctorById(doctorId);
            const doctor = doctorRes.data;
            
            // Lấy appointments của doctor này với bệnh nhân
            const doctorAppointments = appointmentsRes.data.filter(
              appointment => appointment.doctorId === doctorId
            );

            // Lấy conversation và tin nhắn cuối cùng từ backend
            let lastMessageContent = "Chưa có tin nhắn";
            let lastMessageTime = null;
            let unreadCount = 0;
            try {
              const convRes = await conversationApi.getConversationByPatientAndDoctor(targetPatientId, doctorId);
              const conv = convRes?.data;
              if (conv?.conversationId) {
                try {
                  const latestRes = await messageApi.getLatestByConversation(conv.conversationId);
                  const latest = latestRes?.data;
                  if (latest) {
                    lastMessageContent = latest.content || lastMessageContent;
                    lastMessageTime = latest.createdAt || latest.sentAt || null;
                  }
                  
                  // Lấy số tin nhắn chưa đọc
                  try {
                    const unreadRes = await messageApi.getUnreadCount(conv.conversationId, currentUserId);
                    unreadCount = unreadRes?.data || 0;
                  } catch (e) {
                    // ignore if no unread count
                  }
                } catch (e) {
                  // ignore if no latest message
                }
              }
            } catch (e) {
              // No conversation yet
            }

            return {
              ...doctor,
              doctorId,
              doctorName: doctor.user?.lastName + " " + doctor.user?.firstName ||
                          doctor.lastName + " " + doctor.firstName ||
                          "Không rõ",
              doctorEmail: doctor.user?.email || "",
              doctorPhone: doctor.user?.phone || "",
              doctorAvatar: doctor.user?.avatarUrl || "",
              doctorSpecialty: doctor.specialty || "",
              lastMessage: lastMessageContent,
              lastMessageTime: lastMessageTime,
              unreadCount,
              totalAppointments: doctorAppointments.length,
            };
          } catch (error) {
            console.error(`Error fetching doctor ${doctorId}:`, error);
            return null;
          }
        })
      );

      // Filter out null results
      const validDoctors = doctorsWithDetails.filter(doctor => doctor !== null);
      setDoctors(validDoctors);

      // Set selected doctor if doctorId is provided
      if (selectedDoctorId) {
        const doctor = validDoctors.find(d => d.doctorId == selectedDoctorId);
        if (doctor) {
          setSelectedDoctor(doctor);
        }
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, currentUserId, selectedDoctorId, doctors.length]);

  // Load doctors when URL parameters are present or when user is logged in
  useEffect(() => {
    if ((patientId || currentUserId) && (selectedDoctorId || currentUserId)) {
      fetchDoctors();
    }
  }, [patientId, currentUserId, selectedDoctorId, fetchDoctors]);

  // Create conversation for specific doctor if needed
  const createConversationForDoctor = useCallback(async (patientId, doctorId) => {
    const actualPatientId = patientId || currentUserId;
    if (!actualPatientId || !doctorId) {
      console.log("Missing patientId or doctorId:", { actualPatientId, doctorId });
      return null;
    }

    console.log("Checking for existing conversation between patient:", actualPatientId, "and doctor:", doctorId);

    try {
      // Check if conversation already exists
      const existingConversation = await conversationApi.getConversationByPatientAndDoctor(actualPatientId, doctorId);
      if (existingConversation?.data) {
        return existingConversation.data;
      }
    } catch (error) {
      // If API returns 404 or error, conversation doesn't exist
      console.log("❌ Conversation doesn't exist, will check appointment first. Error:", error.message);
    }

    // Check if there's an appointment between patient and doctor before creating conversation
    try {
      console.log("🔍 Checking for appointments between patient:", actualPatientId, "and doctor:", doctorId);
      const appointmentResponse = await appointmentApi.checkAppointmentBetweenPatientAndDoctor(actualPatientId, doctorId);
      
      if (!appointmentResponse.data || appointmentResponse.data.length === 0) {
        console.log("❌ No appointments found between patient and doctor. Cannot create conversation.");
        alert("Bạn cần đặt lịch khám với bác sĩ này trước khi có thể nhắn tin.");
        return null;
      }
      
      console.log("✅ Found appointments, proceeding to create conversation");
    } catch (error) {
      console.error("❌ Error checking appointments:", error);
      alert("Không thể kiểm tra lịch hẹn. Vui lòng thử lại sau.");
      return null;
    }

    // Only create if conversation doesn't exist and appointment exists
    try {
      const conversationData = {
        patientId: parseInt(actualPatientId),
        doctorId: parseInt(doctorId)
      };

      console.log("🔄 Creating new conversation with data:", conversationData);
      const newConversation = await conversationApi.createConversation(conversationData);
      return newConversation.data || newConversation;
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
      return null;
    }
  }, [currentUserId]);

  // Ensure conversation exists and load messages when doctor is selected (from URL or sidebar)
  useEffect(() => {
    const ensureAndLoad = async () => {
      const targetPatientId = urlPatientId || patientId || currentUserId;
      const targetDoctorId = selectedDoctor?.doctorId || selectedDoctorId;
      if (targetPatientId && targetDoctorId) {
        const conv = await createConversationForDoctor(targetPatientId, targetDoctorId);
        const convId = conv?.conversationId;
        setConversationId(convId || null);
        if (convId) {
          try {
            const res = await messageApi.getByConversation(convId);
            const data = Array.isArray(res.data) ? res.data : [];
            const ids = data
              .map((m) => m.messageId ?? m.id)
              .filter((id) => id !== null && id !== undefined)
              .map((id) => String(id));
            seenMessageIdsRef.current = new Set(ids);
            setMessages(data);
            scrollToBottom();
            setLastFetchedAt(new Date().toISOString());
            
            // Đánh dấu tin nhắn đã đọc khi người dùng mở conversation
            try {
              await messageApi.markMessagesAsRead(convId, currentUserId);
              // Cập nhật unreadCount trong danh sách doctors
              setDoctors(prev => prev.map(d =>
                d.doctorId === targetDoctorId
                  ? { ...d, unreadCount: 0 }
                  : d
              ));
            } catch (e) {
              console.error("Error marking messages as read:", e);
            }
          } catch (e) {
            console.error("Error loading messages:", e);
            setMessages([]);
          }
        }
      }
    };
    if ((patientId || urlPatientId || currentUserId) && (selectedDoctor?.doctorId || selectedDoctorId)) {
      ensureAndLoad();
    }
  }, [patientId, urlPatientId, currentUserId, selectedDoctor, selectedDoctorId, createConversationForDoctor, scrollToBottom]);

  // Scroll to bottom when switching doctor explicitly
  useEffect(() => {
    if (selectedDoctor) {
      scrollToBottom();
    }
  }, [selectedDoctor, scrollToBottom]);

  // Poll for new messages (fallback when WS không hoạt động hoặc im ắng)
  useEffect(() => {
    const now = Date.now();
    const wsActive = wsConnected && now - lastWsMessageAtRef.current < 6000; // 6s không nhận gì thì coi như im ắng
    console.log("🔄 Polling check - WS active:", wsActive, "WS connected:", wsConnected, "Last WS message:", now - lastWsMessageAtRef.current);
    if (wsActive) return; // WS đang hoạt động, bỏ polling
    let intervalId;
    if (conversationId) {
      console.log("🔄 Starting polling for conversation:", conversationId);
      intervalId = setInterval(async () => {
        try {
          // Format since for backend LocalDateTime.parse (no timezone suffix)
          const toBackendLocalDateTime = (dateObj) => {
            const pad = (n) => String(n).padStart(2, '0');
            const y = dateObj.getFullYear();
            const m = pad(dateObj.getMonth() + 1);
            const d = pad(dateObj.getDate());
            const h = pad(dateObj.getHours());
            const mi = pad(dateObj.getMinutes());
            const s = pad(dateObj.getSeconds());
            return `${y}-${m}-${d}T${h}:${mi}:${s}`;
          };
          const baseDate = lastFetchedAt ? new Date(lastFetchedAt) : new Date(Date.now() - 60 * 60 * 1000);
          const sinceParam = toBackendLocalDateTime(baseDate);
          const res = await messageApi.getNewMessages(conversationId, sinceParam);
          const newMsgs = Array.isArray(res.data) ? res.data : [];
          console.log("🔄 Polling found", newMsgs.length, "new messages");
          if (newMsgs.length > 0) {
            setMessages(prev => mergeUniqueMessages(prev, newMsgs));
            // Cập nhật last message cho doctor đang chọn ở sidebar
            const latest = newMsgs[newMsgs.length - 1];
            if (latest && selectedDoctor) {
              // Kiểm tra xem tin nhắn mới có phải từ doctor không
              const isFromDoctor = Number(latest.senderId) !== Number(currentUserId);
              setDoctors(prev => prev.map(d =>
                d.doctorId === selectedDoctor.doctorId
                  ? {
                      ...d,
                      lastMessage: latest.content || d.lastMessage,
                      lastMessageTime: latest.createdAt || latest.sentAt || d.lastMessageTime,
                      unreadCount: isFromDoctor ? d.unreadCount + 1 : d.unreadCount,
                    }
                  : d
              ));
            }
            // Tự động cuộn xuống cuối khi có tin nhắn mới
            setTimeout(() => {
              const messagesContainer = document.getElementById("messages-container");
              if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
            }, 50);
          }
          setLastFetchedAt(new Date().toISOString());
        } catch (e) {
          // silent fail
        }
      }, 1500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [conversationId, lastFetchedAt, wsConnected]);

  // WebSocket/STOMP real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const sock = new SockJS(config.helpers.getWebSocketUrl());
    const client = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 3000,
      debug: (str) => {
        console.log("WebSocket Debug:", str);
      },
    });

    client.onConnect = () => {
      console.log("✅ WebSocket connected for conversation:", conversationId);
      setWsConnected(true);
      client.subscribe(`/topic/conversations/${conversationId}`, (frame) => {
        console.log("📨 Received WebSocket message:", frame.body);
        try {
          const incoming = JSON.parse(frame.body);
          lastWsMessageAtRef.current = Date.now();
          // Tránh thêm trùng
          setMessages((prev) => mergeUniqueMessages(prev, [incoming]));
          // Cập nhật dòng preview ở sidebar
          const isFromDoctor = Number(incoming.senderId) !== Number(currentUserId);
          setDoctors(prev => prev.map(d =>
            selectedDoctor?.doctorId && d.doctorId === selectedDoctor.doctorId
              ? {
                  ...d,
                  lastMessage: incoming.content || d.lastMessage,
                  lastMessageTime: incoming.createdAt || incoming.sentAt || d.lastMessageTime,
                  unreadCount: isFromDoctor ? d.unreadCount + 1 : d.unreadCount,
                }
              : d
          ));
          // Cuộn xuống cuối
          requestAnimationFrame(() => {
            const el = document.getElementById("messages-container");
            if (el) el.scrollTop = el.scrollHeight;
          });
        } catch (e) {
          console.error("❌ Error parsing WebSocket message:", e);
        }
      });
    };

    client.onStompError = (error) => {
      console.error("❌ WebSocket STOMP error:", error);
      setWsConnected(false);
    };
    client.onWebSocketClose = (event) => {
      console.log("❌ WebSocket closed:", event);
      setWsConnected(false);
    };

    client.activate();
    return () => {
      setWsConnected(false);
      client.deactivate();
    };
  }, [conversationId, selectedDoctor]);

  // Filter doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          doctor.doctorName?.toLowerCase().includes(query) ||
          doctor.doctorEmail?.toLowerCase().includes(query) ||
          doctor.doctorPhone?.includes(query) ||
          doctor.doctorSpecialty?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [doctors, searchQuery]);

  // Messages for current conversation (already filtered)
  const doctorMessages = useMemo(() => {
    const getTs = (m) => new Date(m.createdAt || m.sentAt || m._arrivalAt || 0).getTime();
    return [...messages].sort((a, b) => getTs(a) - getTs(b));
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDoctor || !conversationId || !currentUserId) return;

    const payload = {
      conversationId: Number(conversationId),
      senderId: Number(currentUserId),
      content: newMessage.trim(),
    };

    // Nếu đang có WebSocket, không dùng optimistic để tránh hiển thị 2 lần
    // WS sẽ push message sau khi backend lưu xong
    let optimistic = null;
    if (!wsConnected) {
      optimistic = {
        messageId: `temp-${Date.now()}`,
        conversationId: Number(conversationId),
        senderId: Number(currentUserId),
        content: newMessage.trim(),
        attachmentURL: null,
        sentAt: new Date().toISOString(),
        messageType: "TEXT",
      };
      setMessages(prev => [...prev, optimistic]);
    }
    setNewMessage("");

    try {
      const res = await messageApi.createMessage(payload);
      const created = res.data || res;
      if (!wsConnected && optimistic) {
        setMessages(prev => prev.map(m => (m.messageId === optimistic.messageId ? created : m)));
      }
      setMessages(prev => mergeUniqueMessages(prev, [created]));
      setDoctors(prev => prev.map(d =>
        selectedDoctor && d.doctorId === selectedDoctor.doctorId
          ? {
              ...d,
              lastMessage: created.content || d.lastMessage,
              lastMessageTime: created.createdAt || created.sentAt || d.lastMessageTime,
              unreadCount: d.unreadCount,
            }
          : d
      ));
      markConversationAsRead();
    } catch (e) {
      console.error("Failed to send message:", e);
      // rollback optimistic
      if (!wsConnected && optimistic) {
        setMessages(prev => prev.filter(m => m.messageId !== optimistic.messageId));
      }
    }

    // Scroll to bottom
    setTimeout(() => {
      const messagesContainer = document.getElementById("messages-container");
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  };

  // Edit message actions (only own messages)
  const beginEditMessage = (msg) => {
    setEditingMessageId(msg.messageId);
    setEditingText(msg.content || "");
    setMenuOpenMessageId(null);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const saveEditMessage = async (msg) => {
    try {
      const id = msg.messageId;
      const res = await messageApi.update(id, { content: editingText, attachmentURL: msg.attachmentURL });
      const updated = res?.data || res;
      setMessages(prev => prev.map(m => (m.messageId === id ? { ...m, ...updated } : m)));
      setEditingMessageId(null);
      setEditingText("");
    } catch (e) {
      console.error("Update message failed:", e);
    }
  };

  const recallMessage = async (msg) => {
    try {
      const id = msg.messageId;
      await messageApi.remove(id);
      setMessages(prev => prev.filter(m => m.messageId !== id));
    } catch (e) {
      console.error("Delete message failed:", e);
    } finally {
      setMenuOpenMessageId(null);
    }
  };

  // 1) Chọn ảnh: tạo preview tạm thời, chưa upload
  const handleChooseImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError(`Ảnh quá lớn (${(file.size/1024/1024).toFixed(1)}MB). Giới hạn ${Math.round(MAX_IMAGE_BYTES/1024/1024)}MB.`);
      e.target.value = "";
      return;
    }
    setUploadError("");
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setPendingImage(url);
    // reset input to allow re-select same file later
    e.target.value = "";
  };

  // 2) Gửi tin nhắn với ảnh: tạo message trước để có messageId, sau đó upload file với messageId để lưu đúng tên file
  const handleSendImageMessage = async () => {
    if (!pendingFile || !conversationId || !currentUserId) return;
    setUploading(true);
    try {
      // A) Tạo optimistic ngay với preview
      let optimistic = null;
      if (!wsConnected) {
        optimistic = {
          messageId: `temp-img-${Date.now()}`,
          conversationId: Number(conversationId),
          senderId: Number(currentUserId),
          content: (newMessage && newMessage.trim()) || "",
          attachmentURL: pendingImage, // local preview
          sentAt: new Date().toISOString(),
          messageType: "IMAGE",
        };
        setMessages(prev => [...prev, optimistic]);
      }

      // B) Upload file -> lấy URL public
      const uploadRes = await fileUploadApi.uploadImage(pendingFile);
      const storedUrl = uploadRes?.data?.url || uploadRes?.data || null;
      if (!storedUrl) throw new Error("Upload failed");

      // C) Tạo message có attachmentURL
      const createRes = await messageApi.createMessage({
        conversationId: Number(conversationId),
        senderId: Number(currentUserId),
        content: (newMessage && newMessage.trim()) || "[image]",
        attachmentURL: storedUrl,
      });
      const created = createRes?.data || createRes;
      if (!wsConnected && optimistic) {
        setMessages(prev => prev.map(m => (m.messageId === optimistic.messageId ? created : m)));
      }
      setMessages(prev => mergeUniqueMessages(prev, [created]));
      setDoctors(prev => prev.map(d =>
        selectedDoctor && d.doctorId === selectedDoctor.doctorId
          ? {
              ...d,
              lastMessage: created.content || (newMessage && newMessage.trim()) || d.lastMessage,
              lastMessageTime: created.createdAt || created.sentAt || d.lastMessageTime,
              unreadCount: d.unreadCount,
            }
          : d
      ));
      markConversationAsRead();

      setNewMessage("");
      setPendingFile(null);
      if (pendingImage) URL.revokeObjectURL(pendingImage);
      setPendingImage(null);
    } catch (err) {
      console.error("Send image message failed:", err);
      const status = err?.response?.status;
      if (status === 413 || /max(imum)? upload size/i.test(String(err?.message))) {
        setUploadError(`Ảnh vượt quá dung lượng máy chủ cho phép. Vui lòng chọn ảnh ≤ ${Math.round(MAX_IMAGE_BYTES/1024/1024)}MB.`);
      } else {
        setUploadError("Không thể gửi ảnh. Vui lòng thử lại.");
      }
      // rollback optimistic nếu có
      setMessages(prev => prev.filter(m => !String(m.messageId).startsWith('temp-img-')));
    } finally {
      setUploading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time: hiển thị bao nhiêu phút trước, ưu tiên createdAt
  const formatTime = (ts) => {
    if (!ts) return "";
    const messageTime = new Date(ts);
    const now = new Date();
    const diffMs = now - messageTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins <= 0) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  // Lock outer page scroll while this page is mounted
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Close image lightbox with ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Render
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status"></div>
        <p className="mt-2">Đang tải tin nhắn...</p>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white rounded-4 shadow-sm border" style={{ height: "calc(100vh - 120px)", overflow: "hidden" }}>
      <div className="d-flex h-100">
        {/* Doctors List Sidebar */}
        <div
          className="border-end bg-light"
          style={{ width: "350px", minWidth: "350px" }}
        >
          {/* Header */}
          <div className="p-3 border-bottom">
            <h5 className="mb-3 fw-bold">Tin nhắn</h5>
            <div className="position-relative">
              <Search
                className="position-absolute"
                style={{
                  left: 12,
                  top: 12,
                  width: 16,
                  height: 16,
                  color: "#888",
                }}
              />
              <Input
                type="text"
                placeholder="Tìm kiếm bác sĩ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
          </div>

          {/* Doctors List */}
          <div className="overflow-auto" style={{ height: "calc(100% - 120px)" }}>
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-5">
                <MessageCircle size={48} color="#ccc" className="mb-3" />
                <p className="text-muted">Chưa có cuộc hội thoại nào</p>
                <p className="text-muted small">Đặt lịch khám để bắt đầu nhắn tin với bác sĩ</p>
                <button 
                  className="btn btn-outline-primary btn-sm mt-2"
                  onClick={() => fetchDoctors()}
                  disabled={loading}
                >
                  {loading ? "Đang tải..." : "Tải danh sách"}
                </button>
              </div>
            ) : (
              filteredDoctors.map((doctor) => (
                <div
                  key={doctor.doctorId}
                  className={`p-3 border-bottom cursor-pointer ${
                    selectedDoctor?.doctorId === doctor.doctorId
                      ? "bg-primary text-white"
                      : "hover-bg-light"
                  }`}
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    // Load doctors if list is empty
                    if (doctors.length === 0) {
                      fetchDoctors();
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <Avatar
                      size={50}
                      src={doctor.doctorAvatar || "/placeholder.svg"}
                      alt={doctor.doctorName}
                      online={doctor.unreadCount > 0}
                    >
                      {doctor.doctorName
                        ? doctor.doctorName.charAt(0).toUpperCase()
                        : "?"}
                    </Avatar>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <h6 className="mb-0 fw-bold">{doctor.doctorName}</h6>
                        {doctor.unreadCount > 0 && (
                          <span className="badge bg-danger rounded-pill">
                            {doctor.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="mb-1 small text-truncate">
                        {doctor.doctorSpecialty}
                      </p>
                      <p className="mb-1 small text-truncate">
                        {doctor.lastMessage}
                      </p>
                      <small className="text-muted">
                        {doctor.lastMessageTime ? formatTime(doctor.lastMessageTime) : ""}
                      </small>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow-1 d-flex flex-column">
          {selectedDoctor ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <Avatar
                    size={45}
                    src={selectedDoctor.doctorAvatar || "/placeholder.svg"}
                    alt={selectedDoctor.doctorName}
                  >
                    {selectedDoctor.doctorName
                      ? selectedDoctor.doctorName.charAt(0).toUpperCase()
                      : "?"}
                  </Avatar>
                  <div>
                    <h6 className="mb-0 fw-bold">{selectedDoctor.doctorName}</h6>
                    <small className="text-muted">
                      {selectedDoctor.doctorSpecialty} • {selectedDoctor.totalAppointments} lịch hẹn
                    </small>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="d-flex align-items-center gap-1"
                  >
                    <Phone size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="d-flex align-items-center gap-1"
                  >
                    <Mail size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="d-flex align-items-center gap-1"
                  >
                    <Calendar size={16} />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div
                id="messages-container"
                className="flex-grow-1 p-3 overflow-auto"
              >
                {doctorMessages.length === 0 ? (
                  <div className="text-center py-5">
                    <MessageCircle size={48} color="#ccc" className="mb-3" />
                    <p className="text-muted">Chưa có tin nhắn nào</p>
                    <p className="text-muted small">
                      Bắt đầu cuộc trò chuyện với {selectedDoctor.doctorName}
                    </p>
                  </div>
                ) : (
                  doctorMessages.map((message) => {
                    const isPatientMsg = Number(message.senderId) === Number(currentUserId);
                    const key = message.messageId || message.id || `${message.senderId}-${message.sentAt}`;
                    return (
                      <div
                        key={key}
                        className={`mb-3 d-flex ${
                          isPatientMsg ? "justify-content-end" : "justify-content-start"
                        }`}
                        onMouseEnter={() => setHoveredMessageId(message.messageId)}
                        onMouseLeave={() => { if (menuOpenMessageId !== message.messageId) setHoveredMessageId(null); }}
                      >
                        <div
                          className={`p-3 rounded-3 ${
                            isPatientMsg ? "bg-primary text-white" : "bg-light text-dark"
                          }`}
                          style={{ maxWidth: "70%" }}
                        >
                          {Number(message.senderId) === Number(currentUserId) && (
                            <div className="position-relative" style={{ height: 0 }}>
                              {(hoveredMessageId === message.messageId || menuOpenMessageId === message.messageId) && (
                                <button
                                  className={`btn btn-sm ${isPatientMsg ? "btn-light" : "btn-outline-secondary"}`}
                                  style={{ position: 'absolute', top: -14, right: -14, padding: '2px 6px' }}
                                  onClick={() => setMenuOpenMessageId(prev => prev === message.messageId ? null : message.messageId)}
                                >
                                  <MoreVertical size={14} />
                                </button>
                              )}
                              {menuOpenMessageId === message.messageId && (
                                <div className="dropdown-menu show" style={{ position: 'absolute', top: 0, right: 16 }}>
                                  <button className="dropdown-item" onClick={() => beginEditMessage(message)}>Chỉnh sửa</button>
                                  <button className="dropdown-item text-danger" onClick={() => recallMessage(message)}>Thu hồi</button>
                                </div>
                              )}
                            </div>
                          )}

                          {editingMessageId === message.messageId ? (
                            <>
                              <Input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="mb-2"
                              />
                              <div className="d-flex gap-2">
                                <button className={`btn btn-sm ${isPatientMsg ? 'btn-light' : 'btn-primary'}`} onClick={() => saveEditMessage(message)}>Lưu</button>
                                <button className="btn btn-sm btn-outline-secondary" onClick={cancelEditMessage}>Hủy</button>
                              </div>
                            </>
                          ) : (
                            <>
                          {message.attachmentURL && (
                            <div className="mb-2">
                              <img
                                src={resolveAttachmentUrl(message.attachmentURL)}
                                alt="attachment"
                                onDoubleClick={() => setLightboxSrc(resolveAttachmentUrl(message.attachmentURL))}
                                style={{
                                  display: 'block',
                                  maxWidth: '100%',
                                  maxHeight: 300,
                                  width: 'auto',
                                  height: 'auto',
                                  objectFit: 'contain',
                                  borderRadius: 8,
                                  cursor: 'zoom-in',
                                }}
                              />
                            </div>
                          )}
                          {message.content && <p className="mb-0">{message.content}</p>}
                          </>
                          )}
                          <small
                            className={`${isPatientMsg ? "text-white-50" : "text-muted"}`}
                          >
                          {formatTime(message.createdAt || message.sentAt)}
                        </small>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-3 border-top">
                <div className="d-flex gap-2">
                  <label className="btn btn-outline-primary d-flex align-items-center mb-0" style={{cursor:"pointer"}}>
                    <input type="file" accept="image/*" onChange={handleChooseImage} hidden disabled={uploading} />
                    <i className="bi bi-image-fill" aria-hidden="true"></i>
                  </label>
                  <Input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-grow-1"
                  />
                  {pendingImage && (
                    <img src={pendingImage} alt="preview" style={{height:40, width:40, objectFit:'cover', borderRadius:6}} />
                  )}
                  <Button
                    onClick={pendingImage ? handleSendImageMessage : handleSendMessage}
                    disabled={pendingImage ? uploading : !newMessage.trim()}
                    className="d-flex align-items-center gap-1"
                  >
                    <Send size={16} />
                    Gửi
                  </Button>
                </div>
                {uploadError && (
                  <div className="mt-2">
                    <small className="text-danger">{uploadError}</small>
                  </div>
                )}
                {pendingImage && (
                  <div className="mt-2">
                    <small className="text-muted">Ảnh sẽ được lưu với tên là ID của tin nhắn sau khi gửi.</small>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center">
                <MessageCircle size={64} color="#ccc" className="mb-3" />
                <h5 className="text-muted">Chọn bác sĩ để bắt đầu trò chuyện</h5>
                <p className="text-muted">
                  Chọn một bác sĩ từ danh sách bên trái để xem tin nhắn
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {lightboxSrc && (
      <div
        onClick={() => setLightboxSrc(null)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          cursor: 'zoom-out',
        }}
      >
        <img
          src={lightboxSrc}
          alt="preview"
          style={{
            maxWidth: '95vw',
            maxHeight: '95vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
          }}
        />
      </div>
    )}
    </>
  );
}

export default PatientMessages;
