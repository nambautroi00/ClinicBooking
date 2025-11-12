import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessageToBot } from '../../api/chatApi';
import doctorApi from '../../api/doctorApi';
import { getFullAvatarUrl } from '../../utils/avatarUtils';

const STORAGE_KEYS = {
  messages: 'clinic_chat_messages',
  keywords: 'clinic_chat_keywords',
  department: 'clinic_chat_department',
  userName: 'clinic_chat_user_name'
};

const DOCTOR_REQUEST_PATTERNS = [
  'tim bac si',
  'tim bac sy',
  'xem bac si',
  'chon bac si',
  'dat bac si',
  'dat bac sy',
  'dat lich',
  'tim bac si giup'
];

const SYMPTOM_KEYWORDS = [
  { match: 'dau dau', label: 'Đau đầu' },
  { match: 'chong mat', label: 'Chóng mặt' },
  { match: 'mat ngu', label: 'Mất ngủ' },
  { match: 'sot cao', label: 'Sốt cao' },
  { match: 'ho', label: 'Ho' },
  { match: 'kho tho', label: 'Khó thở' },
  { match: 'tuc nguc', label: 'Tức ngực' },
  { match: 'dau nguc', label: 'Đau ngực' },
  { match: 'tieu chay', label: 'Tiêu chảy' },
  { match: 'dau bung', label: 'Đau bụng' },
  { match: 'dau xuong', label: 'Đau xương' },
  { match: 'sung khop', label: 'Sưng khớp' },
  { match: 'phat ban', label: 'Phát ban' },
  { match: 'ngua', label: 'Ngứa' },
  { match: 'dau mat', label: 'Đau mắt' },
  { match: 'met moi', label: 'Mệt mỏi' },
  { match: 'buon non', label: 'Buồn nôn' }
];
const SAFETY_NOTICE = 'Thông tin chỉ mang tính tham khảo, không thay thế tư vấn y khoa trực tiếp.';
const ALLOWED_LIKELIHOODS = ['common', 'possible', 'rare', 'rule_out'];

const LIKELIHOOD_LABELS = {
  common: 'Phổ biến',
  possible: 'Có thể',
  rare: 'Hiếm gặp',
  rule_out: 'Cần loại trừ'
};

const LIKELIHOOD_COLORS = {
  common: { bg: '#dcfce7', color: '#166534' },
  possible: { bg: '#e0f2fe', color: '#075985' },
  rare: { bg: '#fef3c7', color: '#92400e' },
  rule_out: { bg: '#fee2e2', color: '#b91c1c' }
};

const BOT_AVATAR = '/images/bot.gif';

const normalizeVietnamese = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');

const safeString = (value, fallback = '') => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const ensureStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeString(item))
    .filter((item) => Boolean(item));
};

const ensurePossibleCauses = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((cause) => {
      const name = safeString(cause?.name);
      if (!name) return null;
      const likelihoodRaw = safeString(cause?.likelihood).toLowerCase();
      const likelihood = ALLOWED_LIKELIHOODS.includes(likelihoodRaw)
        ? likelihoodRaw
        : 'possible';
      return { name, likelihood };
    })
    .filter(Boolean);
};

const buildSchemaPayload = (rawPayload, fallbackInput = '') => {
  if (!rawPayload) return null;

  let source = rawPayload;
  if (typeof rawPayload === 'string') {
    try {
      source = JSON.parse(rawPayload);
    } catch (error) {
      console.warn('Failed to parse AI schema payload', error);
      return null;
    }
  }

  if (typeof source !== 'object' || Array.isArray(source) || source === null) {
    return null;
  }

  const recommended =
    typeof source.recommended_department === 'object' && source.recommended_department !== null
      ? source.recommended_department
      : {};

  const doctorQueryRaw =
    typeof source.doctor_query === 'object' && source.doctor_query !== null
      ? source.doctor_query
      : {};
  const filtersRaw =
    typeof doctorQueryRaw.filters === 'object' && doctorQueryRaw.filters !== null
      ? doctorQueryRaw.filters
      : {};

  const normalized = {
    input: safeString(source.input, fallbackInput),
    intents: ensureStringArray(source.intents),
    symptoms: ensureStringArray(source.symptoms),
    possibleCauses: ensurePossibleCauses(source.possible_causes),
    relatedConditions: ensureStringArray(source.related_conditions),
    redFlags: ensureStringArray(source.red_flags),
    selfCare: ensureStringArray(source.self_care),
    recommendedDepartment: {
      code: safeString(recommended.code),
      name: safeString(recommended.name || recommended.department || ''),
      confidence: Number(recommended.confidence) || 0,
      alternatives: Array.isArray(recommended.alternatives)
        ? recommended.alternatives
            .map((alt) => ({
              code: safeString(alt?.code),
              name: safeString(alt?.name)
            }))
            .filter((alt) => alt.code || alt.name)
        : []
    },
    doctorQuery: {
      departmentCode:
        safeString(doctorQueryRaw.department_code) || safeString(recommended.code),
      filters: {
        location: safeString(filtersRaw.location),
        ratingMin: Number(filtersRaw.rating_min) || 0
      }
    },
    messageToUserMarkdown:
      safeString(source.message_to_user_markdown) ||
      safeString(source.message_to_user) ||
      '',
    nextQuestions: ensureStringArray(source.next_questions),
    safetyNotice: SAFETY_NOTICE
  };

  if (!normalized.messageToUserMarkdown && normalized.symptoms.length > 0) {
    normalized.messageToUserMarkdown = `Mình ghi nhận các triệu chứng: ${normalized.symptoms.join(', ')}.`;
  }

  return normalized;
};

const hasInsightDetails = (payload) => {
  if (!payload) return false;
  return (
    payload.intents.length > 0 ||
    payload.symptoms.length > 0 ||
    payload.possibleCauses.length > 0 ||
    payload.relatedConditions.length > 0 ||
    payload.redFlags.length > 0 ||
    payload.selfCare.length > 0 ||
    Boolean(payload.recommendedDepartment.name) ||
    payload.nextQuestions.length > 0 ||
    Boolean(payload.doctorQuery.departmentCode)
  );
};

const escapeHtml = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatMarkdownText = (value) => {
  const escaped = escapeHtml(value || '');
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const bulletPattern = /(^|\n)\*\s+([^\n]+)/g;
  const withBullets = withBold.replace(
    bulletPattern,
    (match, prefix, item) => `${prefix}&bull; ${item.trim()}`
  );
  return withBullets.replace(/\n/g, '<br/>');
};

const createMessage = (text, sender = 'bot', extra = {}) => ({
  text,
  sender,
  timestamp: new Date().toISOString(),
  ...extra
});

const createMarkdownMessage = (markdownText, sender = 'bot') =>
  createMessage(formatMarkdownText(markdownText || ''), sender, {
    isMarkdown: true,
    rawText: markdownText || ''
  });

const stripBasicHtml = (value = '') =>
  value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const buildHistoryPayload = (historyMessages = []) => {
  if (!Array.isArray(historyMessages)) return [];
  return historyMessages
    .filter((msg) => !msg.type)
    .slice(-6)
    .map((msg) => {
      const baseText = safeString(msg.rawText) ||
        (msg.isMarkdown ? stripBasicHtml(msg.text) : safeString(msg.text));
      if (!baseText) {
        return null;
      }
      return {
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: baseText
      };
    })
    .filter(Boolean);
};

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

  const createGreetingMessage = (name) => {
    if (name) {
      const text = `Chào ${name}, mình là trợ lý y khoa của Clinic Booking. Mình có thể giúp bạn tìm bác sĩ, phòng khám hoặc tư vấn triệu chứng. Bạn đang gặp vấn đề gì về sức khỏe không?`;
      return createMessage(text, 'bot', { rawText: text });
    }
    const text =
      'Xin chào! Mình là trợ lý y khoa của Clinic Booking. Bạn vui lòng cho mình biết tên để mình tiện hỗ trợ và xưng hô nhé.';
    return createMessage(text, 'bot', { rawText: text });
  };

  const getNameFromUserProfile = () => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return '';
      const profile = JSON.parse(raw);
      const candidates = [
        profile.fullName,
        `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        profile.name,
        profile.user?.fullName,
        `${profile.user?.firstName || ''} ${profile.user?.lastName || ''}`.trim()
      ];
      return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
    } catch (error) {
      console.warn('Failed to parse stored user profile', error);
      return '';
    }
  };

  const resolveInitialUserName = () => {
    const cached = loadFromStorage(STORAGE_KEYS.userName, '');
    if (cached) return cached;
    return getNameFromUserProfile();
  };

  const initialUserName = resolveInitialUserName();

  const [messages, setMessages] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.messages, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    return [createGreetingMessage(initialUserName)];
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
  const [userName, setUserName] = useState(initialUserName);
  const [awaitingName, setAwaitingName] = useState(() => !initialUserName);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  useEffect(() => {
    if (userName) {
      localStorage.setItem(STORAGE_KEYS.userName, JSON.stringify(userName));
    } else {
      localStorage.removeItem(STORAGE_KEYS.userName);
    }
  }, [userName]);

  const mergeSymptomKeywords = (candidates = []) => {
    const sanitized = candidates.map((item) => safeString(item)).filter(Boolean);
    if (sanitized.length === 0) return;

    setSymptomKeywords((prev) => {
      const next = [...prev];
      sanitized.forEach((item) => {
        if (!next.includes(item)) {
          next.push(item);
        }
      });
      return next.slice(-20);
    });
  };

  const extractKeywords = (message) => {
    const normalized = normalizeVietnamese(message || '');
    const matched = SYMPTOM_KEYWORDS.filter(({ match }) => normalized.includes(match)).map(
      ({ label }) => label
    );
    mergeSymptomKeywords(matched);
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
    const normalizedInput = normalizeVietnamese(sanitized);
    const userMessage = createMessage(sanitized, 'user', { rawText: sanitized });
    const historyPayload = buildHistoryPayload([...messages, userMessage]);

    pushMessages(userMessage);
    setInputMessage('');

    if (awaitingName) {
      const safeName = sanitized.replace(/\s+/g, ' ').trim() || 'bạn';
      setUserName(safeName);
      setAwaitingName(false);
      pushMessages(createGreetingMessage(safeName));
      return;
    }

    setIsLoading(true);

    extractKeywords(sanitized);

    const userWantsDoctors = DOCTOR_REQUEST_PATTERNS.some((pattern) =>
      normalizedInput.includes(pattern)
    );

    if (userWantsDoctors) {
      await handleDoctorRequest();
      setIsLoading(false);
      return;
    }

    try {
      const reply = await sendMessageToBot({
        message: sanitized,
        keywords: symptomKeywords,
        history: historyPayload
      });
      const botPayload = [];
      const structured = buildSchemaPayload(reply?.schemaPayload || reply?.response, sanitized);

      if (Array.isArray(reply?.symptomKeywords)) {
        mergeSymptomKeywords(reply.symptomKeywords);
      }

      if (structured) {
        mergeSymptomKeywords(structured.symptoms);

        if (structured.messageToUserMarkdown) {
          botPayload.push(createMarkdownMessage(structured.messageToUserMarkdown));
        }

        if (hasInsightDetails(structured)) {
          botPayload.push({
            text: '',
            sender: 'bot',
            timestamp: new Date().toISOString(),
            type: 'insight',
            payload: structured
          });
        }
      }

      if (botPayload.length === 0) {
        const fallbackText =
          reply?.response ||
          'Xin lỗi, hiện tại mình chưa thể phản hồi. Bạn vui lòng thử lại trong giây lát nhé.';
        botPayload.push(createMessage(fallbackText, 'bot', { rawText: fallbackText }));
      }

      if (reply?.needsMoreInfo && reply?.followUpQuestion) {
        botPayload.push(createMessage(reply.followUpQuestion, 'bot', { rawText: reply.followUpQuestion }));
      }

      if (reply?.department) {
        setLastDepartment(reply.department);
      }

      const doctors = Array.isArray(reply?.doctors) ? reply.doctors : [];
      const departmentName = reply?.department?.name;
      const departmentReason = reply?.department?.reason;

      if (!reply?.needsMoreInfo && doctors.length > 0) {
        const doctorIntro = `Mình đã tìm thấy ${doctors.length} bác sĩ phù hợp${
          departmentName ? ` cho khoa ${departmentName}` : ''
        }:`;
        botPayload.push(createMessage(doctorIntro, 'bot', { rawText: doctorIntro }));
        botPayload.push({
          text: '',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          type: 'doctors',
          doctors,
          departmentName
        });
      }

      pushMessages(botPayload);
    } catch (error) {
      console.error('Error sending message:', error);
      const fallbackError = error.message || 'Đã có lỗi xảy ra, bạn vui lòng thử lại sau.';
      pushMessages(
        createMessage(fallbackError, 'bot', {
          isError: true,
          rawText: fallbackError
        })
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

  const goHome = () => {
    navigate('/');
  };

  const handleBrandKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goHome();
    }
  };

  const resetConversation = () => {
    const confirmClear =
      typeof window === 'undefined'
        ? true
        : window.confirm('Xóa toàn bộ hội thoại và bắt đầu lại?');
    if (!confirmClear) return;

    const profileName = getNameFromUserProfile();
    const greeting = createGreetingMessage(profileName);
    setMessages([greeting]);
    setSymptomKeywords([]);
    setLastDepartment(null);
    setUserName(profileName);
    setAwaitingName(!profileName);
    setInputMessage('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.messages);
      localStorage.removeItem(STORAGE_KEYS.keywords);
      localStorage.removeItem(STORAGE_KEYS.department);
      if (profileName) {
        localStorage.setItem(STORAGE_KEYS.userName, JSON.stringify(profileName));
      } else {
        localStorage.removeItem(STORAGE_KEYS.userName);
      }
    }
  };

  const MedicalInsightCard = ({ payload }) => {
    if (!payload) return null;

    const {
      input,
      intents = [],
      symptoms = [],
      possibleCauses = [],
      relatedConditions = [],
      redFlags = [],
      selfCare = [],
      recommendedDepartment = {},
      doctorQuery = {},
      nextQuestions = [],
      safetyNotice = SAFETY_NOTICE
    } = payload;

    const renderChipSection = (title, items) =>
      Array.isArray(items) && items.length > 0 ? (
        <div style={styles.insightSection}>
          <div style={styles.insightSectionTitle}>{title}</div>
          <div style={styles.chipGroup}>
            {items.map((item, idx) => (
              <span key={`${title}-${idx}`} style={styles.chip}>
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null;

    const renderListSection = (title, items, variant = 'default') => {
      if (!Array.isArray(items) || items.length === 0) {
        return null;
      }

      const containerStyle =
        variant === 'warning'
          ? { ...styles.insightSection, ...styles.warningSection }
          : styles.insightSection;
      const listStyle = variant === 'warning' ? styles.warningList : styles.list;
      const itemStyle = variant === 'warning' ? styles.redFlagItem : styles.listItem;

      return (
        <div style={containerStyle}>
          <div style={styles.insightSectionTitle}>{title}</div>
          <ul style={listStyle}>
            {items.map((item, idx) => (
              <li key={`${title}-${idx}`} style={itemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    };

    const renderPossibleCauses = () =>
      Array.isArray(possibleCauses) && possibleCauses.length > 0 ? (
        <div style={styles.insightSection}>
          <div style={styles.insightSectionTitle}>Nguyên nhân có thể</div>
          <ul style={styles.list}>
            {possibleCauses.map((cause, idx) => (
              <li key={`cause-${idx}`} style={styles.listItem}>
                <div style={styles.causeRow}>
                  <span>{cause.name}</span>
                  <span style={styles.likelihoodChip(cause.likelihood)}>
                    {LIKELIHOOD_LABELS[cause.likelihood] || cause.likelihood}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null;

    const confidencePercentage = typeof recommendedDepartment.confidence === 'number'
      ? Math.round(Math.min(Math.max(recommendedDepartment.confidence, 0), 1) * 100)
      : 0;
    const filters = doctorQuery?.filters || {};

    return (
      <div style={styles.insightCard}>
        <div style={styles.insightHeader}>
          <div>
            <div style={styles.insightTitle}>Phân tích y khoa</div>
          </div>
          <div style={styles.insightBadge}>AI schema</div>
        </div>

        {renderChipSection('Ý định', intents)}
        {renderChipSection('Triệu chứng chính', symptoms)}
        {renderPossibleCauses()}
        {renderChipSection('Bệnh liên quan', relatedConditions)}
        {renderListSection('Bạn cần đi khám ngay nếu:', redFlags, 'warning')}
        {renderListSection('Gợi ý tự chăm sóc', selfCare)}
        
        {(recommendedDepartment?.name || recommendedDepartment?.code) && (
          <div style={styles.departmentCard}>
            <div style={styles.insightSectionTitle}>Khoa gợi ý</div>
            <div style={styles.departmentName}>
              {recommendedDepartment.name || 'Chưa xác định'}
            </div>
            <div style={styles.departmentMeta}>
              · Độ tin cậy: {confidencePercentage}%
            </div>
            {Array.isArray(recommendedDepartment.alternatives) &&
              recommendedDepartment.alternatives.length > 0 && (
                <>
                  <div style={styles.altTitle}>Phương án khác</div>
                  <div style={styles.chipGroup}>
                    {recommendedDepartment.alternatives.map((alt, idx) => (
                      <span key={`alt-${idx}`} style={styles.altChip}>
                        {alt.name || alt.code}
                      </span>
                    ))}
                  </div>
                </>
              )}
          </div>
        )}

        {(doctorQuery?.departmentCode || filters.location || filters.ratingMin) && (
          <div style={styles.doctorQueryCard}>
            <div style={styles.insightSectionTitle}>Tìm bác sĩ phù hợp</div>
            <div style={styles.doctorQueryText}>
              Mã khoa ưu tiên: <strong>{doctorQuery.departmentCode || 'Chưa có'}</strong>
            </div>
            <div style={styles.doctorFilters}>
              <span>Vị trí: {filters.location || 'Bất kỳ'}</span>
              <span>Đánh giá tối thiểu: {filters.ratingMin || 0}</span>
            </div>
          </div>
        )}

        {safetyNotice && <div style={styles.safetyNotice}>{safetyNotice}</div>}
      </div>
    );
  };

  const DoctorTable = ({ doctors, departmentName }) => {
    if (!doctors || doctors.length === 0) {
      return null;
    }

    const buildDoctorAvatar = (doctor, fallbackName) => {
      const safeName =
        fallbackName && fallbackName.trim().length > 0 ? fallbackName : 'Doctor';
      const potentialSources = [
        doctor.avatarUrl,
        doctor.avatarPath,
        doctor.avatar,
        doctor.user?.avatarUrl,
        doctor.user?.avatarPath,
        doctor.user?.avatar && `/api/files/avatar/${doctor.user.avatar}`
      ].filter(Boolean);

      for (const source of potentialSources) {
        const fullUrl = getFullAvatarUrl(source);
        if (fullUrl) {
          return fullUrl;
        }
      }

      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        safeName
      )}&background=2563EB&color=fff`;
    };

    const normalizeDoctor = (doctor) => {
      const doctorId = doctor.id || doctor.doctorId;
      const fullName =
        doctor.fullName ||
        `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim() ||
        'Bác Sĩ';
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
      const avatar = buildDoctorAvatar(doctor, fullName);

      return {
        ...doctor,
        doctorId,
        fullName,
        departmentLabel: dept,
        specialty: doctor.specialty || 'Chuyên Khoa Tổng Quát',
        rating,
        avatar,
        degree: doctor.degree || doctor.user?.degree || 'Bác Sĩ',
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
      <div style={styles.page}>
        <div style={styles.topBar}>
          <div
            style={styles.brandGroup}
            onClick={goHome}
            role="button"
            tabIndex={0}
            onKeyDown={handleBrandKeyDown}
          >
            <img src="/images/logo.png" alt="Clinic Booking" style={styles.brandImage} />
            <div style={styles.brandText}>
              <span style={styles.brandName}>CLINIC BOOKING</span>
              <span style={styles.brandDivider}>/</span>
              <span style={styles.brandHelper}>Trợ lý y khoa</span>
            </div>
            <span style={styles.verifiedDot}>✓</span>
          </div>
          <button style={styles.resetButton} onClick={resetConversation}>
            Bắt đầu mới
          </button>
        </div>
        <div style={styles.container}>
          {lastDepartment?.name && (
            <div style={styles.subHeader}>
              <div style={styles.subHint}>
                Gợi ý hiện tại: <strong>{lastDepartment.name}</strong>
              </div>
            </div>
          )}

          <div style={styles.chatContainer}>
            {messages.map((msg, index) => (
              <div key={index} style={styles.messageWrapper(msg.sender)}>
                {msg.sender === 'bot' && msg.type !== 'doctors' && msg.type !== 'insight' && (
                  <img src={BOT_AVATAR} alt="AI trợ lý" style={styles.botAvatar} />
                )}
                <div style={{ maxWidth: msg.type === 'doctors' ? '100%' : '70%' }}>
                  {msg.type === 'doctors' ? (
                    <DoctorTable doctors={msg.doctors} departmentName={msg.departmentName} />
                  ) : msg.type === 'insight' ? (
                    <>
                      <MedicalInsightCard payload={msg.payload} />
                      <div style={styles.timestamp}>{formatTime(msg.timestamp)}</div>
                    </>
                  ) : (
                    <>
                      {msg.isMarkdown ? (
                        <div
                          style={styles.message(msg.sender, msg.isError)}
                          dangerouslySetInnerHTML={{ __html: msg.text }}
                        />
                      ) : (
                        <div style={styles.message(msg.sender, msg.isError)}>{msg.text}</div>
                      )}
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
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column'
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    position: 'sticky',
    top: 0,
    zIndex: 20,
    boxShadow: '0 4px 12px rgba(15,23,42,0.04)'
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  brandImage: {
    width: '48px',
    height: '48px',
    objectFit: 'cover',
    borderRadius: '50%',
    backgroundColor: '#e0f2fe',
    padding: '6px'
  },
  brandText: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
    color: '#1e293b',
    fontWeight: '600'
  },
  brandName: {
    color: '#2563eb',
    letterSpacing: '0.5px'
  },
  brandDivider: {
    color: '#cbd5f5'
  },
  brandHelper: {
    color: '#0f172a'
  },
  verifiedDot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700'
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    maxWidth: '720px',
    margin: '0 auto',
    width: '100%',
    padding: '12px 20px 16px',
    minHeight: 0
  },
  subHeader: {
    display: 'flex',
    justifyContent: 'center',
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
  resetButton: {
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.2s',
    boxShadow: '0 8px 16px rgba(37,99,235,0.3)'
  },
  chatContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0 96px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: 'transparent',
    minHeight: 0
  },
  insightCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 8px 22px rgba(15,23,42,0.08)',
    marginTop: '6px'
  },
  insightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  insightTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a'
  },
  insightSubtitle: {
    fontSize: '13px',
    color: '#475569',
    marginTop: '4px'
  },
  insightBadge: {
    padding: '6px 12px',
    borderRadius: '999px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: '12px',
    fontWeight: '600'
  },
  insightSection: {
    marginTop: '12px'
  },
  insightSectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '6px'
  },
  chipGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  chip: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  list: {
    margin: 0,
    paddingLeft: '18px',
    color: '#1f2937',
    fontSize: '14px',
    lineHeight: 1.5
  },
  warningSection: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '12px',
    marginTop: '12px'
  },
  warningList: {
    margin: 0,
    paddingLeft: '18px',
    color: '#b91c1c',
    fontSize: '14px',
    lineHeight: 1.5
  },
  listItem: {
    marginBottom: '4px'
  },
  redFlagItem: {
    marginBottom: '4px',
    color: '#b91c1c',
    fontWeight: '600'
  },
  causeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center'
  },
  likelihoodChip: (type = 'possible') => {
    const palette = LIKELIHOOD_COLORS[type] || LIKELIHOOD_COLORS.possible;
    return {
      backgroundColor: palette.bg,
      color: palette.color,
      borderRadius: '10px',
      fontSize: '12px',
      padding: '2px 8px',
      fontWeight: '600'
    };
  },
  departmentCard: {
    marginTop: '12px',
    padding: '12px',
    borderRadius: '14px',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb'
  },
  departmentName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a'
  },
  departmentMeta: {
    fontSize: '13px',
    color: '#475569',
    marginTop: '4px'
  },
  altTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
    marginTop: '10px',
    marginBottom: '6px'
  },
  altChip: {
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600'
  },
  doctorQueryCard: {
    marginTop: '12px',
    padding: '12px',
    borderRadius: '14px',
    border: '1px dashed #93c5fd',
    backgroundColor: '#eff6ff'
  },
  doctorQueryText: {
    fontSize: '14px',
    color: '#1f2937'
  },
  doctorFilters: {
    marginTop: '6px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    fontSize: '13px',
    color: '#475569'
  },
  safetyNotice: {
    marginTop: '12px',
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic'
  },
  messageWrapper: (sender) => ({
    display: 'flex',
    alignItems: 'flex-start',
    width: '100%',
    justifyContent: sender === 'user' ? 'flex-end' : 'flex-start'
  }),
  botAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '12px',
    boxShadow: '0 4px 10px rgba(15,23,42,0.12)'
  },
  message: (sender, isError) => ({
    padding: '16px 20px',
    borderRadius: '20px',
    backgroundColor: sender === 'user' ? '#2563eb' : isError ? '#fee2e2' : '#f8fafc',
    color: sender === 'user' ? '#fff' : isError ? '#b91c1c' : '#1f2937',
    boxShadow: sender === 'user' ? '0 6px 16px rgba(37,99,235,0.25)' : '0 6px 16px rgba(15,23,42,0.08)',
    fontSize: '16px',
    lineHeight: 1.6,
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
    position: 'sticky',
    bottom: 0,
    display: 'flex',
    padding: '12px 0 16px',
    gap: '10px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 40%)',
    backdropFilter: 'blur(4px)',
    zIndex: 15
  },
  input: {
    flex: 1,
    padding: '16px 20px',
    borderRadius: '30px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontSize: '16px',
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
