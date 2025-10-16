import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import patientApi from "../../api/patientApi";
import appointmentApi from "../../api/appointmentApi";
import doctorApi from "../../api/doctorApi";
import conversationApi from "../../api/conversationApi";
import messageApi from "../../api/messageApi";
import fileUploadApi from "../../api/fileUploadApi";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Cookies from "js-cookie";
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

// Messages are loaded from API

function DoctorMessages() {
  const [searchParams] = useSearchParams();
  const selectedPatientId = searchParams.get("patientId");
  const urlDoctorId = searchParams.get("doctorId");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // local preview URL
  const [pendingFile, setPendingFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
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

  const mergeUniqueMessages = useCallback((existing, incomingList) => {
    const next = [...existing];
    for (const msg of incomingList) {
      const id = msg.messageId || msg.id;
      if (id) {
        if (!seenMessageIdsRef.current.has(id)) {
          seenMessageIdsRef.current.add(id);
          next.push({ ...msg, _arrivalAt: Date.now() });
        }
      } else {
        const duplicate = next.some(m => m.senderId === msg.senderId && m.content === msg.content && (m.createdAt || m.sentAt) === (msg.createdAt || msg.sentAt));
        if (!duplicate) next.push({ ...msg, _arrivalAt: Date.now() });
      }
    }
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

  // Fetch doctorId and currentUserId
  useEffect(() => {
    const fetchDoctorId = async () => {
      const userId = Cookies.get("userId") || currentUser?.id;
      if (userId) {
        setCurrentUserId(userId);
        try {
          const res = await doctorApi.getDoctorByUserId(userId);
          const data = res.data || res;
          setDoctorId(data.doctorId);
        } catch (err) {
          console.error("Error fetching doctorId:", err);
        }
      }
    };
    fetchDoctorId();
  }, [currentUser]);

  // Fetch patients with appointments
  const fetchPatients = useCallback(async () => {
    if (!doctorId) return;

    // Tránh flicker: chỉ bật loading trong lần tải đầu
    if (patients.length === 0) setLoading(true);
    try {
      // Lấy tất cả appointments của bác sĩ
      const appointmentsRes = await appointmentApi.getAppointmentsByDoctor(doctorId);
      
      // Lấy danh sách patient IDs từ appointments
      const patientIds = [...new Set(
        appointmentsRes.data
          .filter(appointment => appointment.patientId !== null)
          .map(appointment => appointment.patientId)
      )];

      // Lấy thông tin chi tiết của từng patient
      const patientsWithDetails = await Promise.all(
        patientIds.map(async (patientId) => {
          try {
            const patientRes = await patientApi.getPatientById(patientId);
            const patient = patientRes.data;
            
            // Lấy appointments của patient này với bác sĩ
            const patientAppointments = appointmentsRes.data.filter(
              appointment => appointment.patientId === patientId
            );

            // Lấy conversation và tin nhắn cuối cùng từ backend
            let lastMessageContent = "Chưa có tin nhắn";
            let lastMessageTime = null;
            let unreadCount = 0;
            try {
              const convRes = await conversationApi.getConversationByPatientAndDoctor(patientId, doctorId);
              const conv = convRes?.data;
              if (conv?.conversationId) {
                try {
                  const latestRes = await messageApi.getLatestByConversation(conv.conversationId);
                  const latest = latestRes?.data;
                  if (latest) {
                    lastMessageContent = latest.content || lastMessageContent;
                    lastMessageTime = latest.createdAt || latest.sentAt || null;
                  }
                } catch (e) {
                  // ignore if no latest message
                }
              }
            } catch (e) {
              // No conversation yet
            }

            return {
              ...patient,
              patientId,
              patientName: patient.user?.lastName + " " + patient.user?.firstName ||
                          patient.lastName + " " + patient.firstName ||
                          "Không rõ",
              patientEmail: patient.user?.email || "",
              patientPhone: patient.user?.phone || "",
              patientAvatar: patient.user?.avatarUrl || "",
              lastMessage: lastMessageContent,
              lastMessageTime: lastMessageTime,
              unreadCount,
              totalAppointments: patientAppointments.length,
            };
          } catch (error) {
            console.error(`Error fetching patient ${patientId}:`, error);
            return null;
          }
        })
      );

      // Filter out null results
      const validPatients = patientsWithDetails.filter(patient => patient !== null);
      setPatients(validPatients);

      // Set selected patient if patientId is provided
      if (selectedPatientId) {
        const patient = validPatients.find(p => p.patientId == selectedPatientId);
        if (patient) {
          setSelectedPatient(patient);
        }
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, selectedPatientId, patients.length]);

  useEffect(() => {
    if (doctorId) {
      fetchPatients();
    }
  }, [doctorId, fetchPatients]);

  // Create conversation for specific patient if needed
  const createConversationForPatient = useCallback(async (patientId, doctorId) => {
    if (!patientId || !doctorId) {
      console.log("Missing patientId or doctorId:", { patientId, doctorId });
      return null;
    }

    console.log("Checking for existing conversation between patient:", patientId, "and doctor:", doctorId);

    try {
      // Check if conversation already exists
      const existingConversation = await conversationApi.getConversationByPatientAndDoctor(patientId, doctorId);
      if (existingConversation?.data) {
        return existingConversation.data;
      }
    } catch (error) {
      // If API returns 404 or error, conversation doesn't exist
      console.log("❌ Conversation doesn't exist, will create new one. Error:", error.message);
    }

    // Only create if conversation doesn't exist
    try {
      const conversationData = {
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId)
      };

      console.log("🔄 Creating new conversation with data:", conversationData);
      const newConversation = await conversationApi.createConversation(conversationData);
      return newConversation.data || newConversation;
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
      return null;
    }
  }, []);

  // Ensure conversation exists and load messages when patient is selected (from URL or sidebar)
  useEffect(() => {
    const ensureAndLoad = async () => {
      const targetDoctorId = urlDoctorId || doctorId;
      const targetPatientId = selectedPatient?.patientId || selectedPatientId;
      if (targetPatientId && targetDoctorId) {
        const conv = await createConversationForPatient(targetPatientId, targetDoctorId);
        const convId = conv?.conversationId;
        setConversationId(convId || null);
        if (convId) {
          try {
            const res = await messageApi.getByConversation(convId);
            const data = Array.isArray(res.data) ? res.data : [];
            // seed seen ids to avoid future duplicates
            const ids = data.map(m => m.messageId || m.id).filter(Boolean);
            ids.forEach(id => seenMessageIdsRef.current.add(id));
            setMessages(data);
            scrollToBottom();
            setLastFetchedAt(new Date().toISOString());
          } catch (e) {
            console.error("Error loading messages:", e);
            setMessages([]);
          }
        }
      }
    };
    if ((doctorId || urlDoctorId) && (selectedPatient?.patientId || selectedPatientId)) {
      ensureAndLoad();
    }
  }, [doctorId, urlDoctorId, selectedPatient, selectedPatientId, createConversationForPatient, scrollToBottom]);

  // Scroll to bottom when switching patient explicitly
  useEffect(() => {
    if (selectedPatient) {
      scrollToBottom();
    }
  }, [selectedPatient, scrollToBottom]);

  // Poll for new messages (fallback when WS không hoạt động hoặc im ắng)
  useEffect(() => {
    const now = Date.now();
    const wsActive = wsConnected && now - lastWsMessageAtRef.current < 6000; // 6s không nhận gì thì coi như im ắng
    if (wsActive) return; // WS đang hoạt động, bỏ polling
    let intervalId;
    if (conversationId) {
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
          if (newMsgs.length > 0) {
            setMessages(prev => mergeUniqueMessages(prev, newMsgs));
            // Cập nhật last message cho patient đang chọn ở sidebar
            const latest = newMsgs[newMsgs.length - 1];
            if (latest && selectedPatient) {
              setPatients(prev => prev.map(p =>
                p.patientId === selectedPatient.patientId
                  ? {
                      ...p,
                      lastMessage: latest.content || p.lastMessage,
                      lastMessageTime: latest.createdAt || latest.sentAt || p.lastMessageTime,
                    }
                  : p
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

    const sock = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 3000,
    });

    client.onConnect = () => {
          setWsConnected(true);
      client.subscribe(`/topic/conversations/${conversationId}`, (frame) => {
        try {
          const incoming = JSON.parse(frame.body);
          lastWsMessageAtRef.current = Date.now();
          // Tránh thêm trùng
          setMessages((prev) => mergeUniqueMessages(prev, [incoming]));
          // Cập nhật dòng preview ở sidebar
          setPatients(prev => prev.map(p =>
            selectedPatient?.patientId && p.patientId === selectedPatient.patientId
              ? {
                  ...p,
                  lastMessage: incoming.content || p.lastMessage,
                  lastMessageTime: incoming.createdAt || incoming.sentAt || p.lastMessageTime,
                }
              : p
          ));
          // Cuộn xuống cuối
          requestAnimationFrame(() => {
            const el = document.getElementById("messages-container");
            if (el) el.scrollTop = el.scrollHeight;
          });
        } catch {}
      });
    };

    client.onStompError = () => {
      setWsConnected(false);
    };
    client.onWebSocketClose = () => {
      setWsConnected(false);
    };

    client.activate();
    return () => {
      setWsConnected(false);
      client.deactivate();
    };
  }, [conversationId, selectedPatient]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          patient.patientName?.toLowerCase().includes(query) ||
          patient.patientEmail?.toLowerCase().includes(query) ||
          patient.patientPhone?.includes(query)
        );
      }
      return true;
    });
  }, [patients, searchQuery]);

  // Messages for current conversation (already filtered)
  const patientMessages = useMemo(() => {
    const getTs = (m) => new Date(m.createdAt || m.sentAt || m._arrivalAt || 0).getTime();
    return [...messages].sort((a, b) => getTs(a) - getTs(b));
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient || !conversationId || !currentUserId) return;

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

      setNewMessage("");
      setPendingFile(null);
      if (pendingImage) URL.revokeObjectURL(pendingImage);
      setPendingImage(null);
    } catch (err) {
      console.error("Send image message failed:", err);
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
    <div className="bg-white rounded-4 shadow-sm border" style={{ height: "calc(100vh - 120px)", overflow: "hidden" }}>
      <div className="d-flex h-100">
        {/* Patients List Sidebar */}
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
                placeholder="Tìm kiếm bệnh nhân..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
          </div>

          {/* Patients List */}
          <div className="overflow-auto" style={{ height: "calc(100% - 120px)" }}>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-5">
                <MessageCircle size={48} color="#ccc" className="mb-3" />
                <p className="text-muted">Không có bệnh nhân nào</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.patientId}
                  className={`p-3 border-bottom cursor-pointer ${
                    selectedPatient?.patientId === patient.patientId
                      ? "bg-primary text-white"
                      : "hover-bg-light"
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <Avatar
                      size={50}
                      src={patient.patientAvatar || "/placeholder.svg"}
                      alt={patient.patientName}
                      online={patient.unreadCount > 0}
                    >
                      {patient.patientName
                        ? patient.patientName.charAt(0).toUpperCase()
                        : "?"}
                    </Avatar>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <h6 className="mb-0 fw-bold">{patient.patientName}</h6>
                        {patient.unreadCount > 0 && (
                          <span className="badge bg-danger rounded-pill">
                            {patient.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="mb-1 small text-truncate">
                        {patient.lastMessage}
                      </p>
                      <small className="text-muted">
                        {patient.lastMessageTime ? formatTime(patient.lastMessageTime) : ""}
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
          {selectedPatient ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <Avatar
                    size={45}
                    src={selectedPatient.patientAvatar || "/placeholder.svg"}
                    alt={selectedPatient.patientName}
                  >
                    {selectedPatient.patientName
                      ? selectedPatient.patientName.charAt(0).toUpperCase()
                      : "?"}
                  </Avatar>
                  <div>
                    <h6 className="mb-0 fw-bold">{selectedPatient.patientName}</h6>
                    <small className="text-muted">
                      {selectedPatient.totalAppointments} lịch hẹn
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
                {patientMessages.length === 0 ? (
                  <div className="text-center py-5">
                    <MessageCircle size={48} color="#ccc" className="mb-3" />
                    <p className="text-muted">Chưa có tin nhắn nào</p>
                    <p className="text-muted small">
                      Bắt đầu cuộc trò chuyện với {selectedPatient.patientName}
                    </p>
                  </div>
                ) : (
                  patientMessages.map((message) => {
                    const isDoctorMsg = Number(message.senderId) === Number(doctorId);
                    const key = message.messageId || message.id || `${message.senderId}-${message.sentAt}`;
                    return (
                      <div
                        key={key}
                        className={`mb-3 d-flex ${
                          isDoctorMsg ? "justify-content-end" : "justify-content-start"
                        }`}
                        onMouseEnter={() => setHoveredMessageId(message.messageId)}
                        onMouseLeave={() => { if (menuOpenMessageId !== message.messageId) setHoveredMessageId(null); }}
                      >
                        <div
                          className={`p-3 rounded-3 ${
                            isDoctorMsg ? "bg-primary text-white" : "bg-light text-dark"
                          }`}
                          style={{ maxWidth: "70%" }}
                        >
                          {Number(message.senderId) === Number(currentUserId) && (
                            <div className="position-relative" style={{ height: 0 }}>
                              {(hoveredMessageId === message.messageId || menuOpenMessageId === message.messageId) && (
                                <button
                                  className={`btn btn-sm ${isDoctorMsg ? "btn-light" : "btn-outline-secondary"}`}
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
                                <button className={`btn btn-sm ${isDoctorMsg ? 'btn-light' : 'btn-primary'}`} onClick={() => saveEditMessage(message)}>Lưu</button>
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
                                style={{
                                  display: 'block',
                                  maxWidth: '100%',
                                  maxHeight: 300,
                                  width: 'auto',
                                  height: 'auto',
                                  objectFit: 'contain',
                                  borderRadius: 8,
                                }}
                              />
                            </div>
                          )}
                          {message.content && <p className="mb-0">{message.content}</p>}
                          </>
                          )}
                          <small
                            className={`${isDoctorMsg ? "text-white-50" : "text-muted"}`}
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
                <h5 className="text-muted">Chọn bệnh nhân để bắt đầu trò chuyện</h5>
                <p className="text-muted">
                  Chọn một bệnh nhân từ danh sách bên trái để xem tin nhắn
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorMessages;
