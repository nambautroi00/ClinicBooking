import React, { useEffect, useRef, useState } from 'react';
import Header from '../layout/Header';
import { useNavigate } from 'react-router-dom';
import { sendMessageToBot } from '../../api/chatApi';
import doctorApi from '../../api/doctorApi';

const STORAGE_KEYS = {
  messages: 'clinic_chat_messages',
  keywords: 'clinic_chat_keywords',
  department: 'clinic_chat_department'
};

const DOCTOR_REQUEST_PATTERNS = [
  'tìm bác sĩ',
  'tim bac si',
  'đặt bác sĩ',
  'dat bac si',
  'xem bác sĩ',
  'chon bac si'
];

const SYMPTOM_KEYWORDS = [
  'đau đầu',
  'chóng mặt',
  'mất ngủ',
  'sốt cao',
  'ho',
  'khó thở',
  'tức ngực',
  'đau ngực',
  'tiêu chảy',
  'đau bụng',
  'đau xương',
  'sưng khớp',
  'phát ban',
  'ngứa',
  'đau mắt',
  'mệt mỏi',
  'buồn nôn'
];

const createMessage = (text, sender = 'bot') => ({
  text,
  sender,
  timestamp: new Date().toISOString()
});

const loadFromStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse localStorage item', key, error);
    return fallback;
  }
};

const ChatBot = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.messages, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    return [
      createMessage(
        'Xin chào! Tôi là trợ lý đặt lịch khám của Clinic Booking. Bạn mô tả triệu chứng để mình tư vấn nhé.'
      )
    ];
  });

  const [symptomKeywords, setSymptomKeywords] = useState(() =>
    loadFromStorage(STORAGE_KEYS.keywords, [])
  );

  const [lastDepartment, setLastDepartment] = useState(() =>
    loadFromStorage(STORAGE_KEYS.department, null)
  );

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSendHovered, setIsSendHovered] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.keywords, JSON.stringify(symptomKeywords));
  }, [symptomKeywords]);

  useEffect(() => {
    if (lastDepartment) {
      localStorage.setItem(STORAGE_KEYS.department, JSON.stringify(lastDepartment));
    } else {
      localStorage.removeItem(STORAGE_KEYS.department);
    }
  }, [lastDepartment]);

  const extractKeywords = (message) => {
    const lower = message.toLowerCase();
    const matched = SYMPTOM_KEYWORDS.filter((keyword) => lower.includes(keyword));
    if (matched.length === 0) return;

    setSymptomKeywords((prev) => {
      const next = Array.from(new Set([...prev, ...matched]));
      return next.slice(-15);
    });
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const pushMessages = (newMessages) => {
    setMessages((prev) => [...prev, ...(Array.isArray(newMessages) ? newMessages : [newMessages])]);
  };

  const handleDoctorRequest = async () => {
    if (!lastDepartment) {
      pushMessages(
        createMessage(
          'Mình chưa ghi nhận khoa phù hợp. Bạn có thể mô tả rõ triệu chứng (ví dụ đau ở đâu, kéo dài bao lâu) để mình tư vấn chính xác hơn nhé.'
        )
      );
      return;
    }

    const summaryText =
      symptomKeywords.length > 0
        ? `Dựa trên triệu chứng bạn cung cấp (${symptomKeywords.join(
            ', '
          )}), khoa phù hợp nhất là ${lastDepartment.name}.`
        : `Khoa phù hợp nhất hiện tại là ${lastDepartment.name}.`;

    pushMessages(createMessage(summaryText));

    if (!lastDepartment.id) {
      pushMessages(
        createMessage(
          'Hiện mình chưa có mã khoa cụ thể để tra cứu bác sĩ. Bạn giúp mình mô tả chi tiết hơn để hệ thống xác nhận nhé.'
        )
      );
      return;
    }

    try {
      const response = await doctorApi.getDoctorsByDepartment(lastDepartment.id);
      const doctors = Array.isArray(response?.data) ? response.data : [];

      if (doctors.length === 0) {
        pushMessages(
          createMessage(
            `Hiện tại chưa có bác sĩ nào thuộc khoa ${lastDepartment.name}. Bạn có thể chọn khoa khác hoặc để lại thông tin để được liên hệ sau nhé.`
          )
        );
        return;
      }

      pushMessages([
        createMessage(
          `Mình đã tìm thấy ${doctors.length} bác sĩ thuộc khoa ${lastDepartment.name}:`
        ),
        {
          text: '',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          type: 'doctors',
          doctors,
          departmentName: lastDepartment.name
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch doctors', error);
      pushMessages(
        createMessage(
          'Xin lỗi, mình chưa tra được danh sách bác sĩ lúc này. Bạn thử lại sau hoặc liên hệ hotline giúp mình nhé.'
        )
      );
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const sanitized = inputMessage.trim();
    const lowerMessage = sanitized.toLowerCase();
    const userMessage = {
      text: sanitized,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    pushMessages(userMessage);
    setInputMessage('');
    setIsLoading(true);

    extractKeywords(lowerMessage);

    const userWantsDoctors = DOCTOR_REQUEST_PATTERNS.some((pattern) =>
      lowerMessage.includes(pattern)
    );

    if (userWantsDoctors) {
      await handleDoctorRequest();
      setIsLoading(false);
      return;
    }

    try {
      const reply = await sendMessageToBot(sanitized);
      const botPayload = [];

      botPayload.push(
        createMessage(
          reply?.response ||
            'Xin lỗi, hiện tại mình chưa thể phản hồi. Bạn vui lòng thử lại trong giây lát nhé.'
        )
      );

      if (reply?.needsMoreInfo && reply?.followUpQuestion) {
        botPayload.push(createMessage(reply.followUpQuestion));
      }

      if (reply?.department) {
        setLastDepartment(reply.department);
      }

      const doctors = Array.isArray(reply?.doctors) ? reply.doctors : [];
      const departmentName = reply?.department?.name;
      const departmentReason = reply?.department?.reason;

      if (!reply?.needsMoreInfo && doctors.length > 0) {
        botPayload.push(
          createMessage(
            `Mình đã tìm thấy ${doctors.length} bác sĩ phù hợp${
              departmentName ? ` cho khoa ${departmentName}` : ''
            }:`
          )
        );
        botPayload.push({
          text: '',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          type: 'doctors',
          doctors,
          departmentName
        });
      }

      if (departmentName && doctors.length === 0) {
        botPayload.push(
          createMessage(
            `Khoa gợi ý hiện tại là ${departmentName}${
              departmentReason ? ` (vì ${departmentReason})` : ''
            }. Bạn có muốn mình tìm bác sĩ của khoa này không? Chỉ cần nhắn “tìm bác sĩ ${
              departmentName || ''
            }” hoặc mô tả thêm triệu chứng nhé.`
          )
        );
      }

      pushMessages(botPayload);
    } catch (error) {
      console.error('Error sending message:', error);
      pushMessages(
        createMessage(error.message || 'Đã có lỗi xảy ra, bạn vui lòng thử lại sau.', 'bot')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleBookDoctor = (doctorId) => {
    if (doctorId) {
      window.location.href = `/patient/booking/${doctorId}`;
    } else {
      navigate('/doctors');
    }
  };

  const DoctorTable = ({ doctors, departmentName }) => {
    if (!doctors || doctors.length === 0) {
      return null;
    }

    const normalizeDoctor = (doctor) => {
      const doctorId = doctor.id || doctor.doctorId;
      const fullName =
        doctor.fullName ||
        `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim() ||
        'Bác sĩ';
      const dept =
        doctor.departmentName ||
        doctor.department?.departmentName ||
        departmentName ||
        'Đa khoa';
      const rating =
        Number(
          doctor.rating ??
            doctor.avgRating ??
            doctor.averageRating ??
            doctor.averageScore ??
            0
        ) || 0;
      let avatar =
        doctor.avatarUrl ||
        (doctor.user?.avatar
          ? `http://localhost:8080/api/files/avatar/${doctor.user.avatar}`
          : null) ||
        doctor.user?.avatarUrl ||
        null;
      if (!avatar) {
        avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          fullName
        )}&background=2563EB&color=fff`;
      }

      return {
        ...doctor,
        doctorId,
        fullName,
        departmentLabel: dept,
        specialty: doctor.specialty || 'Chuyên khoa tổng quát',
        rating,
        avatar,
        degree: doctor.degree || doctor.user?.degree || 'Bác sĩ',
        experience: doctor.workExperience || '',
        hospital: doctor.user?.address || ''
      };
    };

    const sortedDoctors = doctors
      .map(normalizeDoctor)
      .sort((a, b) => b.rating - a.rating || a.fullName.localeCompare(b.fullName))
      .slice(0, 5);

    const topDoctor = sortedDoctors[0];
    const suggestionDoctors = sortedDoctors.slice(1);

    const renderDoctorCard = (doctor, variant = 'primary', idx = 0) => (
      <div
        key={`${doctor.doctorId || doctor.fullName}-${idx}`}
        style={
          variant === 'primary' ? styles.primaryDoctorCard : styles.suggestionCard
        }
      >
        <div style={styles.doctorCardHead}>
          <img src={doctor.avatar} alt={doctor.fullName} style={styles.avatar} />
          <div style={{ flex: 1 }}>
            <div style={styles.doctorName}>{doctor.fullName}</div>
            <div style={styles.doctorDegree}>
              {doctor.degree}
              {doctor.experience ? ` • ${doctor.experience}` : ''}
            </div>
          </div>
          {doctor.rating > 0 && (
            <div style={styles.ratingBadge}>
              ⭐ {doctor.rating.toFixed(1)}
            </div>
          )}
        </div>
        <div style={styles.doctorMeta}>
          {doctor.hospital || `Phụ trách khoa ${doctor.departmentLabel}`}
        </div>
        <div style={styles.tagGroup}>
          {doctor.specialty && <span style={styles.tag}>{doctor.specialty}</span>}
          {doctor.departmentLabel && (
            <span style={styles.tag}>{doctor.departmentLabel}</span>
          )}
        </div>
        <button
          style={styles.cardButton}
          onClick={() => handleBookDoctor(doctor.doctorId)}
        >
          Đặt lịch với bác sĩ
        </button>
      </div>
    );

    return (
      <div style={styles.tableWrapper}>
        <div style={styles.tableIntro}>
          {departmentName ? (
            <>
              <div style={styles.tableIntroTitle}>
                Mình tìm thấy một vài kết quả cho khoa {departmentName}.
              </div>
              <div style={styles.tableIntroSub}>
                Bác sĩ phù hợp nhất ở bên dưới, bạn có muốn đặt lịch ngay không?
              </div>
            </>
          ) : (
            <>
              <div style={styles.tableIntroTitle}>
                Đây là những bác sĩ nổi bật phù hợp với triệu chứng của bạn.
              </div>
              <div style={styles.tableIntroSub}>
                Hãy chọn bác sĩ mong muốn hoặc nói thêm nhu cầu cụ thể nhé.
              </div>
            </>
          )}
        </div>

        {renderDoctorCard(topDoctor, 'primary')}

        {suggestionDoctors.length > 0 && (
          <>
            <div style={styles.suggestionTitle}>Bác sĩ gợi ý thêm:</div>
            <div style={styles.suggestionList}>
              {suggestionDoctors.map((doctor, idx) =>
                renderDoctorCard(doctor, 'secondary', idx)
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.subHeader}>
            <div style={styles.subTitle}>Trợ lý y khoa</div>
            {lastDepartment?.name && (
              <div style={styles.subHint}>
                Gợi ý hiện tại: <strong>{lastDepartment.name}</strong>
              </div>
            )}
          </div>

          <div style={styles.chatContainer}>
            {messages.map((msg, index) => (
              <div key={index} style={styles.messageWrapper(msg.sender)}>
                <div style={{ maxWidth: msg.type === 'doctors' ? '100%' : '70%' }}>
                  {msg.type === 'doctors' ? (
                    <DoctorTable doctors={msg.doctors} departmentName={msg.departmentName} />
                  ) : (
                    <>
                      <div style={styles.message(msg.sender, msg.isError)}>{msg.text}</div>
                      <div style={styles.timestamp}>{formatTime(msg.timestamp)}</div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={styles.loadingIndicator}>
                <div style={styles.loadingBubble}>Bot đang trả lời…</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputContainer}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Nhập triệu chứng hoặc câu hỏi của bạn..."
              style={{
                ...styles.input,
                ...(isInputFocused ? styles.inputFocus : {})
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              onMouseEnter={() => setIsSendHovered(true)}
              onMouseLeave={() => setIsSendHovered(false)}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                ...styles.sendButton,
                ...(isSendHovered && inputMessage.trim() && !isLoading ? styles.sendButtonHover : {}),
                ...(!inputMessage.trim() || isLoading ? styles.sendButtonDisabled : {})
              }}
            >
              {isLoading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  page: {
    height: 'calc(100vh - 72px)',
    backgroundColor: '#f5f7fa',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px'
  },
  subHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  subTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937'
  },
  subHint: {
    fontSize: '14px',
    color: '#4b5563'
  },
  chatContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e5e7eb'
  },
  messageWrapper: (sender) => ({
    display: 'flex',
    justifyContent: sender === 'user' ? 'flex-end' : 'flex-start'
  }),
  message: (sender, isError) => ({
    padding: '12px 16px',
    borderRadius: '18px',
    backgroundColor: sender === 'user' ? '#2563eb' : isError ? '#f87171' : '#f8fafc',
    color: sender === 'user' || isError ? '#fff' : '#1f2937',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    fontSize: '15px',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap'
  }),
  timestamp: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '4px',
    textAlign: 'right'
  },
  loadingIndicator: {
    display: 'flex',
    justifyContent: 'flex-start'
  },
  loadingBubble: {
    backgroundColor: '#e2e8f0',
    padding: '10px 16px',
    borderRadius: '16px',
    color: '#475569',
    fontStyle: 'italic'
  },
  inputContainer: {
    display: 'flex',
    padding: '20px',
    gap: '10px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e5e7eb'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '24px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  inputFocus: {
    borderColor: '#2563eb',
    boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.15)'
  },
  sendButton: {
    padding: '12px 24px',
    borderRadius: '24px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    minWidth: '80px'
  },
  sendButtonHover: {
    backgroundColor: '#1e40af',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(37,99,235,0.35)'
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5f5',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  tableWrapper: {
    marginTop: '12px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
    padding: '20px'
  },
  tableIntro: {
    marginBottom: '16px'
  },
  tableIntroTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#0f172a'
  },
  tableIntroSub: {
    marginTop: '4px',
    fontSize: '14px',
    color: '#475569'
  },
  primaryDoctorCard: {
    border: '1px solid #bfdbfe',
    borderRadius: '16px',
    padding: '16px',
    background: 'linear-gradient(135deg, #eff6ff, #ffffff)',
    boxShadow: '0 10px 25px rgba(37,99,235,0.12)',
    marginBottom: '18px'
  },
  suggestionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '10px'
  },
  suggestionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  suggestionCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '14px',
    backgroundColor: '#f8fafc'
  },
  doctorCardHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    objectFit: 'cover',
    backgroundColor: '#e0e7ff'
  },
  doctorName: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#0f172a'
  },
  doctorDegree: {
    fontSize: '13px',
    color: '#475569'
  },
  ratingBadge: {
    backgroundColor: '#fde68a',
    color: '#92400e',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '13px',
    fontWeight: '600'
  },
  doctorMeta: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#475569'
  },
  tagGroup: {
    marginTop: '12px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  tag: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600'
  },
  cardButton: {
    marginTop: '14px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default ChatBot;
