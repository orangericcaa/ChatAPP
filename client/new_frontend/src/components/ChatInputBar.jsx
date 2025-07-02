import React, { useState, useRef, useEffect } from 'react';

const ChatInputBar = ({ onSendMessage, onVideoCall, onSendImage, onSendVoice }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef(null);

  // 自动调整输入框高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 120; // 最大高度
      const scrollHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.7)',
    border: '1px solid #f8bbd9',
    gap: '12px',
  };

  const leftButtonsStyle = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  };

  const buttonStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8bbd9',
    color: '#e91e63',
  };

  const buttonHoverStyle = {
    backgroundColor: '#f48fb1',
    transform: 'scale(1.05)',
  };

  const buttonActiveStyle = {
    transform: 'scale(0.95)',
  };

  const inputContainerStyle = {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
  };

  const inputStyle = {
    width: '100%',
    minHeight: '40px',
    maxHeight: '120px',
    padding: '12px 60px 12px 16px',
    border: '1px solid #f8bbd9',
    borderRadius: '20px',
    backgroundColor: '#ffffff',
    boxShadow: 'inset 0 2px 4px rgba(233, 30, 99, 0.06)',
    resize: 'none',
    fontSize: '14px',
    lineHeight: '1.4',
    outline: 'none',
    fontFamily: 'inherit',
    overflow: 'hidden',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const inputFocusStyle = {
    borderColor: '#e91e63',
    boxShadow: 'inset 0 2px 4px rgba(233, 30, 99, 0.1), 0 0 0 2px rgba(233, 30, 99, 0.1)',
  };

  const sendButtonStyle = {
    position: 'absolute',
    right: '8px',
    bottom: '6px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#e91e63',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    opacity: inputValue.trim() ? 1 : 0.5,
  };

  const sendButtonHoverStyle = {
    backgroundColor: '#c2185b',
    transform: 'scale(1.05)',
  };

  const IconButton = ({ onClick, children, title }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    return (
      <button
        style={{
          ...buttonStyle,
          ...(isHovered ? buttonHoverStyle : {}),
          ...(isActive ? buttonActiveStyle : {}),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onClick={onClick}
        title={title}
      >
        {children}
      </button>
    );
  };

  const SendButton = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <button
        style={{
          ...sendButtonStyle,
          ...(isHovered && inputValue.trim() ? sendButtonHoverStyle : {}),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSend}
        disabled={!inputValue.trim()}
      >
        ➤
      </button>
    );
  };

  return (
    <div style={containerStyle}>
      <div style={leftButtonsStyle}>
        <IconButton onClick={onVideoCall} title="视频通话">
          📹
        </IconButton>
        <IconButton onClick={onSendImage} title="发送图片">
          🖼️
        </IconButton>
        <IconButton onClick={onSendVoice} title="发送语音">
          🎤
        </IconButton>
      </div>

      <div style={inputContainerStyle}>
        <textarea
          ref={textareaRef}
          style={inputStyle}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={(e) => e.target.style.cssText += inputFocusStyle.borderColor ? `border-color: ${inputFocusStyle.borderColor}; box-shadow: ${inputFocusStyle.boxShadow};` : ''}
          onBlur={(e) => e.target.style.cssText = e.target.style.cssText.replace(/border-color:[^;]*;?/g, '').replace(/box-shadow:[^;]*;?/g, '')}
          placeholder="输入消息..."
          rows={1}
        />
        <SendButton />
      </div>
    </div>
  );
};

export default ChatInputBar;
