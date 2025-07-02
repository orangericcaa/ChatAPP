
import React, { useState, useEffect } from 'react';

// 聊天列表组件，支持外部传入聊天数据
const ChatListPage = ({ onClose, onSwitchChat, chatList: propChatList = [], onClearUnread }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [chatList, setChatList] = useState([]);

  // 聊天数据排序，最近时间在最上面
  useEffect(() => {
    if (Array.isArray(propChatList)) {
      // 假设每条数据有 timestamp 字段，类型为 Date 或可比较的字符串
      const sorted = [...propChatList].sort((a, b) => {
        // 支持时间戳为数字或字符串
        const tA = new Date(a.timestamp).getTime();
        const tB = new Date(b.timestamp).getTime();
        return tB - tA;
      });
      setChatList(sorted);
    }
  }, [propChatList]);

  // 点击联系人，清除未读
  const handleChatClick = (chat, index) => {
    if (onSwitchChat) onSwitchChat(chat.id);
    if (onClearUnread) onClearUnread(chat.id);
    // 本地也清除未读（如果没有 onClearUnread）
    setChatList(prev => prev.map((item, i) => i === index ? { ...item, unreadCount: 0 } : item));
  };

  // 桌面端右侧面板样式
  const panelStyle = {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #f8bbd9',
  };

  const headerStyle = {
    padding: '20px',
    borderBottom: '1px solid #f8bbd9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#212529',
  };

  const closeButtonStyle = {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#666',
    transition: 'all 0.2s ease',
  };

  const listContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 0',
  };

  const chatItemStyle = (index) => ({
    padding: '16px 20px',
    borderBottom: '1px solid #f5f5f5',
    cursor: 'pointer',
    backgroundColor: hoveredIndex === index ? '#f8f9fa' : 'transparent',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  });

  const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  };

  const contentStyle = {
    flex: 1,
    minWidth: 0,
  };

  const nameRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  };

  const nameStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#212529',
  };

  const timestampStyle = {
    fontSize: '12px',
    color: '#999',
  };

  const messageRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const messageStyle = {
    fontSize: '13px',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    marginRight: '8px',
  };

  const unreadBadgeStyle = {
    backgroundColor: '#e91e63',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: '500',
    minWidth: '18px',
    textAlign: 'center',
    flexShrink: 0,
  };

  return (
    <div style={panelStyle}>
      {/* 头部 */}
      <div style={headerStyle}>
        <div style={titleStyle}>最近消息</div>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>
      </div>

      {/* 聊天列表 */}
      <div style={listContainerStyle}>
        {chatList.map((chat, index) => (
          <div
            key={chat.id}
            style={chatItemStyle(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handleChatClick(chat, index)}
          >
            <div style={avatarStyle}>{chat.avatar}</div>
            <div style={contentStyle}>
              <div style={nameRowStyle}>
                <span style={nameStyle}>{chat.name}</span>
                <span style={timestampStyle}>{chat.timestamp}</span>
              </div>
              <div style={messageRowStyle}>
                <span style={messageStyle}>{chat.lastMessage}</span>
                {chat.unreadCount > 0 && (
                  <span style={unreadBadgeStyle}>{chat.unreadCount}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatListPage;
