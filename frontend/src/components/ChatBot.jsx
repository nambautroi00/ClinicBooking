import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToBot } from '../api/chatApi';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call the API
      const botReply = await sendMessageToBot(inputMessage);

      // Add bot response to chat
      const botMessage = {
        text: botReply,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // Add error message
      const errorMessage = {
        text: error.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true
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
    }
  };

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
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
            <div>
              <div style={styles.message(msg.sender, msg.isError)}>
                {msg.text}
              </div>
              <div style={styles.timestamp}>
                {formatTime(msg.timestamp)}
              </div>
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
