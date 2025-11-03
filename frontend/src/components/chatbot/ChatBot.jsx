import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToBot } from '../../api/chatApi';
import doctorApi from '../../api/doctorApi';
import departmentApi from '../../api/departmentApi';
import { useNavigate } from 'react-router-dom';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Load danh sách chuyên khoa từ database
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentApi.getAllDepartmentsList();
        if (response.data?.content) {
          setDepartments(response.data.content);
        } else if (Array.isArray(response.data)) {
          setDepartments(response.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  // Phát hiện chuyên khoa từ tin nhắn
  const detectSpecialty = (message) => {
    const lowerMessage = message.toLowerCase().trim();
    const bookingKeywords = ['đặt lịch', 'đặt khám', 'khám bệnh', 'khám', 'hẹn khám', 'muốn khám'];
    
    // Kiểm tra xem có từ khóa đặt lịch không
    const hasBookingIntent = bookingKeywords.some(kw => lowerMessage.includes(kw));
    
    if (hasBookingIntent && departments.length > 0) {
      // Tìm chuyên khoa trong tin nhắn dựa trên department names từ DB
      for (const dept of departments) {
        const deptName = dept.departmentName.toLowerCase();
        // Tách các từ trong tên khoa để match linh hoạt hơn
        // VD: "Tim mạch" có thể match với "tim", "mạch", hoặc "tim mạch"
        const words = deptName.split(/[\s-]+/);
        
        // Kiểm tra exact match hoặc chứa từng từ
        if (lowerMessage.includes(deptName) || 
            words.some(word => word.length > 2 && lowerMessage.includes(word))) {
          return dept.departmentName;
        }
      }
    }
    
    return null;
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with a welcome message
  useEffect(() => {
    setMessages([
      {
        text: 'Xin chào! Tôi là trợ lý đặt lịch khám bệnh. Tôi có thể giúp gì cho bạn?',
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  }, []);

    const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Phát hiện chuyên khoa
      const specialty = detectSpecialty(inputMessage);

      if (specialty) {
        // Nếu phát hiện chuyên khoa, tìm bác sĩ
        try {
          const response = await doctorApi.getDoctorsBySpecialty(specialty);
          const doctors = response.data;

          if (doctors && doctors.length > 0) {
            // Thêm tin nhắn giới thiệu
            const introMessage = {
              text: `Tôi tìm thấy ${doctors.length} bác sĩ chuyên khoa ${specialty}:`,
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, introMessage]);

            // Thêm danh sách bác sĩ
            const doctorsMessage = {
              text: '',
              sender: 'bot',
              timestamp: new Date(),
              type: 'doctors',
              doctors: doctors
            };
            setMessages(prev => [...prev, doctorsMessage]);
          } else {
            const noResultMessage = {
              text: `Rất tiếc, hiện tại chưa có bác sĩ chuyên khoa ${specialty}.`,
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, noResultMessage]);
          }
        } catch (error) {
          console.error('Error fetching doctors:', error);
          // Nếu lỗi, gửi tin nhắn thông thường tới bot
          const reply = await sendMessageToBot(inputMessage);
          const botMessage = {
            text: reply,
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } else {
        // Gửi tin nhắn thông thường tới bot
        const reply = await sendMessageToBot(inputMessage);
        const botMessage = {
          text: reply,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: error.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    header: {
      backgroundColor: '#4a90e2',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontSize: '24px',
      fontWeight: '600'
    },
    chatContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    messageWrapper: (sender) => ({
      display: 'flex',
      justifyContent: sender === 'user' ? 'flex-end' : 'flex-start',
      marginBottom: '8px'
    }),
    message: (sender, isError) => ({
      maxWidth: '70%',
      padding: '12px 16px',
      borderRadius: '18px',
      backgroundColor: sender === 'user' 
        ? '#4a90e2' 
        : isError 
          ? '#ff6b6b' 
          : '#ffffff',
      color: sender === 'user' || isError ? 'white' : '#333',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      wordWrap: 'break-word',
      fontSize: '15px',
      lineHeight: '1.5'
    }),
    timestamp: {
      fontSize: '11px',
      color: '#999',
      marginTop: '4px',
      textAlign: 'right'
    },
    loadingIndicator: {
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '8px'
    },
    loadingBubble: {
      backgroundColor: '#e9ecef',
      padding: '12px 16px',
      borderRadius: '18px',
      color: '#6c757d',
      fontSize: '14px',
      fontStyle: 'italic',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    },
    inputContainer: {
      display: 'flex',
      padding: '20px',
      backgroundColor: 'white',
      borderTop: '1px solid #e0e0e0',
      gap: '10px'
    },
    input: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: '24px',
      border: '1px solid #ddd',
      fontSize: '15px',
      outline: 'none',
      transition: 'border-color 0.3s',
    },
    inputFocus: {
      borderColor: '#4a90e2'
    },
    sendButton: {
      padding: '12px 24px',
      borderRadius: '24px',
      backgroundColor: '#4a90e2',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '600',
      transition: 'all 0.3s',
      minWidth: '80px'
    },
    sendButtonHover: {
      backgroundColor: '#357abd',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(74, 144, 226, 0.3)'
    },
    sendButtonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
      opacity: 0.6
    },
    doctorCard: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      transition: 'all 0.3s',
      cursor: 'pointer'
    },
    doctorCardHover: {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transform: 'translateY(-2px)'
    },
    doctorAvatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      objectFit: 'cover',
      backgroundColor: '#e9ecef',
      flexShrink: 0
    },
    doctorInfo: {
      flex: 1,
      minWidth: 0
    },
    doctorName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#212529',
      marginBottom: '4px'
    },
    doctorSpecialty: {
      fontSize: '14px',
      color: '#6c757d',
      marginBottom: '4px'
    },
    doctorRating: {
      fontSize: '13px',
      color: '#ffc107',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    bookButton: {
      backgroundColor: '#4a90e2',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      whiteSpace: 'nowrap'
    },
    bookButtonHover: {
      backgroundColor: '#357abd',
      transform: 'scale(1.05)'
    }
  };

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Component hiển thị card bác sĩ
  const DoctorCard = ({ doctor }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);

    const handleBookClick = () => {
      navigate(`/doctor/${doctor.doctorId}`);
    };

    const getAvatarUrl = () => {
      if (doctor.user?.avatar) {
        return `http://localhost:8080/api/files/avatar/${doctor.user.avatar}`;
      }
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        `${doctor.user?.firstName || 'Doctor'} ${doctor.user?.lastName || ''}`
      )}&background=4a90e2&color=fff&size=120`;
    };

    return (
      <div
        style={{
          ...styles.doctorCard,
          ...(isHovered ? styles.doctorCardHover : {})
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={getAvatarUrl()}
          alt={`${doctor.user?.firstName} ${doctor.user?.lastName}`}
          style={styles.doctorAvatar}
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=Doctor&background=4a90e2&color=fff&size=120`;
          }}
        />
        <div style={styles.doctorInfo}>
          <div style={styles.doctorName}>
            {doctor.user?.firstName} {doctor.user?.lastName}
          </div>
          <div style={styles.doctorSpecialty}>
            {doctor.specialty}
          </div>
          {doctor.rating && (
            <div style={styles.doctorRating}>
              ⭐ {doctor.rating.toFixed(1)}
            </div>
          )}
        </div>
        <button
          style={{
            ...styles.bookButton,
            ...(isButtonHovered ? styles.bookButtonHover : {})
          }}
          onClick={handleBookClick}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
        >
          Đặt lịch
        </button>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        Clinic Booking Chatbot 💬
      </div>

      {/* Chat Messages */}
      <div style={styles.chatContainer}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.messageWrapper(msg.sender)}>
            <div style={{ maxWidth: msg.type === 'doctors' ? '100%' : '70%' }}>
              {msg.type === 'doctors' ? (
                // Hiển thị danh sách bác sĩ
                <div>
                  {msg.doctors.map((doctor, idx) => (
                    <DoctorCard key={idx} doctor={doctor} />
                  ))}
                </div>
              ) : (
                // Hiển thị tin nhắn thông thường
                <>
                  <div style={styles.message(msg.sender, msg.isError)}>
                    {msg.text}
                  </div>
                  <div style={styles.timestamp}>
                    {formatTime(msg.timestamp)}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={styles.loadingIndicator}>
            <div style={styles.loadingBubble}>
              Bot đang trả lời...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder="Nhập tin nhắn của bạn..."
          style={{
            ...styles.input,
            ...(isInputFocused ? styles.inputFocus : {})
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          disabled={!inputMessage.trim() || isLoading}
          style={{
            ...styles.sendButton,
            ...(isButtonHovered && inputMessage.trim() && !isLoading ? styles.sendButtonHover : {}),
            ...(!inputMessage.trim() || isLoading ? styles.sendButtonDisabled : {})
          }}
        >
          {isLoading ? 'Đang gửi...' : 'Gửi'}
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
