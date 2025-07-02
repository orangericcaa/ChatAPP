import React from 'react';

const ChatBubble = ({ message, isOwn, timestamp, avatar }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: isOwn ? 'row-reverse' : 'row',
    alignItems: 'flex-end',
    marginBottom: '16px',
    gap: '8px',
  };

  const avatarStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: '4px',
    overflow: 'hidden',
    border: isOwn ? '2px solid #e91e63' : '2px solid #f8bbd9',
  };

  const avatarImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const bubbleContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: isOwn ? 'flex-end' : 'flex-start',
    maxWidth: 'calc(100% - 50px)',
  };

  const bubbleStyle = {
    maxWidth: '100%',
    position: 'relative',
    padding: '12px 16px',
    borderRadius: '18px',
    wordWrap: 'break-word',
    fontSize: '14px',
    lineHeight: '1.4',
    marginBottom: '4px',
  };

  const ownBubbleStyle = {
    ...bubbleStyle,
    backgroundColor: '#ffffff',
    color: '#e91e63',
    borderBottomRightRadius: '6px',
    boxShadow: '0 2px 8px rgba(233, 30, 99, 0.15)',
  };

  const otherBubbleStyle = {
    ...bubbleStyle,
    backgroundColor: '#f8bbd9',
    color: '#ffffff',
    borderBottomLeftRadius: '6px',
    boxShadow: '0 2px 8px rgba(233, 30, 99, 0.15)',
  };

  const timestampStyle = {
    fontSize: '11px',
    color: '#ad7a99',
    marginTop: '2px',
    marginLeft: isOwn ? '0' : '8px',
    marginRight: isOwn ? '8px' : '0',
  };

  // 修复的气泡尾巴样式
  const tailStyle = {
    position: 'absolute',
    bottom: '4px',
    width: '0',
    height: '0',
    borderStyle: 'solid',
  };

  const ownTailStyle = {
    ...tailStyle,
    right: '-6px',
    borderWidth: '6px 0 0 8px',
    borderColor: 'transparent transparent transparent #ffffff',
  };

  const otherTailStyle = {
    ...tailStyle,
    left: '-6px',
    borderWidth: '6px 8px 0 0',
    borderColor: 'transparent #f8bbd9 transparent transparent',
  };

  return (
    <div style={containerStyle}>
      {/* 头像 */}
      <div style={avatarStyle}>
        <img
          src={`/picture/${avatar}`}
          alt="用户头像"
          style={avatarImageStyle}
        />
      </div>

      {/* 气泡和时间戳 */}
      <div style={bubbleContainerStyle}>
        <div style={isOwn ? ownBubbleStyle : otherBubbleStyle}>
          {message}
          <div style={isOwn ? ownTailStyle : otherTailStyle}></div>
        </div>
        {timestamp && (
          <div style={timestampStyle}>
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;