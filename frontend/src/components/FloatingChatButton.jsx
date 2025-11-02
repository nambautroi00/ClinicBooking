import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingChatButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    navigate('/chatbot');
  };

  // Add keyframes if not already added
  React.useEffect(() => {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(74, 144, 226, 0.4);
        }
        50% {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 10px rgba(74, 144, 226, 0);
        }
      }
    `;

    try {
      let animationExists = false;
      for (let i = 0; i < styleSheet.cssRules.length; i++) {
        if (styleSheet.cssRules[i].name === 'pulse') {
          animationExists = true;
          break;
        }
      }
      if (!animationExists) {
        styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
      }
    } catch (e) {
      // Ignore if can't access stylesheet
    }
  }, []);

  // Ẩn button khi đang ở trang chatbot
  if (location.pathname === '/chatbot') {
    return null;
  }

  const styles = {
    container: {
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      zIndex: 1000,
    },
    button: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: '#4a90e2',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: isHovered 
        ? '0 8px 20px rgba(74, 144, 226, 0.4)' 
        : '0 4px 12px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease',
      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      animation: 'pulse 2s infinite',
    },
    icon: {
      width: '32px',
      height: '32px',
      fill: 'white',
    },
    tooltip: {
      position: 'absolute',
      right: '75px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#333',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px',
      whiteSpace: 'nowrap',
      fontSize: '14px',
      fontWeight: '500',
      opacity: isHovered ? 1 : 0,
      visibility: isHovered ? 'visible' : 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
    tooltipArrow: {
      position: 'absolute',
      right: '-6px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 0,
      height: 0,
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderLeft: '6px solid #333',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.tooltip}>
        Trợ lý AI - Đặt lịch khám
        <div style={styles.tooltipArrow}></div>
      </div>
      <button
        style={styles.button}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Open Chatbot"
        title="Mở trợ lý AI"
      >
        {/* Chat Bubble Icon SVG */}
        <svg
          style={styles.icon}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main chat bubble */}
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          {/* Three dots inside bubble representing typing/chat */}
          <circle cx="8" cy="10" r="1.5" fill="white"/>
          <circle cx="12" cy="10" r="1.5" fill="white"/>
          <circle cx="16" cy="10" r="1.5" fill="white"/>
        </svg>
      </button>
    </div>
  );
};

export default FloatingChatButton;
