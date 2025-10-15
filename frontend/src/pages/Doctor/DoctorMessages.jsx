import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import patientApi from "../../api/patientApi";
import appointmentApi from "../../api/appointmentApi";
import doctorApi from "../../api/doctorApi";
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

// Mock message data - trong thực tế sẽ lấy từ API
const mockMessages = [
  {
    id: 1,
    patientId: 1,
    doctorId: 1,
    content: "Chào bác sĩ, tôi muốn hỏi về tình trạng sức khỏe của mình",
    sender: "patient",
    timestamp: new Date(Date.now() - 3600000),
    read: true,
  },
  {
    id: 2,
    patientId: 1,
    doctorId: 1,
    content: "Chào bạn, tôi đã xem kết quả khám của bạn. Mọi thứ đều ổn, bạn có thể yên tâm.",
    sender: "doctor",
    timestamp: new Date(Date.now() - 3000000),
    read: true,
  },
  {
    id: 3,
    patientId: 1,
    doctorId: 1,
    content: "Cảm ơn bác sĩ. Tôi có cần uống thuốc gì thêm không?",
    sender: "patient",
    timestamp: new Date(Date.now() - 1800000),
    read: true,
  },
  {
    id: 4,
    patientId: 1,
    doctorId: 1,
    content: "Bạn chỉ cần uống thuốc theo đơn đã kê, không cần thêm gì. Nhớ tái khám sau 1 tuần nhé.",
    sender: "doctor",
    timestamp: new Date(Date.now() - 900000),
    read: false,
  },
];

function DoctorMessages() {
  const [searchParams] = useSearchParams();
  const selectedPatientId = searchParams.get("patientId");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);

  // Get current user from localStorage (memoized)
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  // Fetch doctorId
  useEffect(() => {
    const fetchDoctorId = async () => {
      const userId = Cookies.get("userId") || currentUser?.id;
      if (userId) {
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

    setLoading(true);
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

            // Lấy tin nhắn cuối cùng
            const patientMessages = messages.filter(msg => msg.patientId === patientId);
            const lastMessage = patientMessages.sort((a, b) => b.timestamp - a.timestamp)[0];
            const unreadCount = patientMessages.filter(msg => msg.sender === "patient" && !msg.read).length;

            return {
              ...patient,
              patientId,
              patientName: patient.user?.lastName + " " + patient.user?.firstName ||
                          patient.lastName + " " + patient.firstName ||
                          "Không rõ",
              patientEmail: patient.user?.email || "",
              patientPhone: patient.user?.phone || "",
              patientAvatar: patient.user?.avatarUrl || "",
              lastMessage: lastMessage?.content || "Chưa có tin nhắn",
              lastMessageTime: lastMessage?.timestamp || null,
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
  }, [doctorId, selectedPatientId, messages]);

  useEffect(() => {
    if (doctorId) {
      fetchPatients();
    }
  }, [doctorId, fetchPatients]);

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

  // Get messages for selected patient
  const patientMessages = useMemo(() => {
    if (!selectedPatient) return [];
    return messages
      .filter(msg => msg.patientId === selectedPatient.patientId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, selectedPatient]);

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedPatient) return;

    const message = {
      id: messages.length + 1,
      patientId: selectedPatient.patientId,
      doctorId: doctorId,
      content: newMessage.trim(),
      sender: "doctor",
      timestamp: new Date(),
      read: true,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Scroll to bottom
    setTimeout(() => {
      const messagesContainer = document.getElementById("messages-container");
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Vừa xong";
    } else if (diffInHours < 24) {
      return messageTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return messageTime.toLocaleDateString("vi-VN");
    }
  };

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
    <div className="bg-white rounded-4 shadow-sm border" style={{ height: "calc(100vh - 200px)" }}>
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
                style={{ maxHeight: "calc(100vh - 300px)" }}
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
                  patientMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-3 d-flex ${
                        message.sender === "doctor" ? "justify-content-end" : "justify-content-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-3 ${
                          message.sender === "doctor"
                            ? "bg-primary text-white"
                            : "bg-light text-dark"
                        }`}
                        style={{ maxWidth: "70%" }}
                      >
                        <p className="mb-0">{message.content}</p>
                        <small
                          className={`${
                            message.sender === "doctor" ? "text-white-50" : "text-muted"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-3 border-top">
                <div className="d-flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-grow-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="d-flex align-items-center gap-1"
                  >
                    <Send size={16} />
                    Gửi
                  </Button>
                </div>
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
