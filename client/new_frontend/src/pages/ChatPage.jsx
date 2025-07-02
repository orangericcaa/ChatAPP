import React, { useState, useRef, useEffect } from 'react';
import { httpClient } from '../../config/httpClient.js';
import { API_ENDPOINTS } from '../../config/api.js';
import VideoBubble from '../components/VideoBubble.jsx';
import ChatInputBar from '../components/ChatInputBar.jsx';
import ChatListPage from '../components/ChatListPage.jsx';
import VideoCallModal from '../components/VideoCallModal.jsx';
import VoiceChatModal from '../components/VoiceChat.jsx';

const ChatPage = ({ onNavigateToFriends, currentUser }) => {
  // 当前聊天对象ID（好友邮箱）
  const [currentChatId, setCurrentChatId] = useState('');
  // 消息列表
  const [messages, setMessages] = useState([]);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  const [contactInfo, setContactInfo] = useState({
    name: "❤(^_^)✝天神降临✝张潇涵✝（^_^）❤",
    isOnline: true,
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 拉取消息和联系人信息
  useEffect(() => {
    if (!currentChatId) return;
    // 获取消息
    httpClient.get(API_ENDPOINTS.CHAT.MESSAGES, {
      user1: currentUser?.email,
      user2: currentChatId,
      limit: 100,
    }).then(res => {
      setMessages(res.data || []);
    }).catch(() => setMessages([]));

    // 获取联系人信息（假设通过搜索接口获取）
    httpClient.get(API_ENDPOINTS.USER.SEARCH, { keyword: currentChatId }).then(res => {
      const user = (res.data?.users || []).find(u => u.email === currentChatId);
      setContactInfo(user ? { name: user.name, isOnline: true } : { name: '未知用户', isOnline: false });
    });
  }, [currentChatId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送文本消息
  const handleSendMessage = async (messageText) => {
    if (!currentChatId || !messageText) return;
    try {
      await httpClient.post(API_ENDPOINTS.CHAT.SEND, {
        sender: currentUser?.email,
        receiver: currentChatId,
        content: messageText,
        type: 'text',
        timestamp: Date.now(),
      });
      // 重新拉取消息
      httpClient.get(API_ENDPOINTS.CHAT.MESSAGES, {
        user1: currentUser?.email,
        user2: currentChatId,
        limit: 100,
      }).then(res => {
        setMessages(res.data || []);
      });
    } catch (e) {
      alert(e.message || '消息发送失败');
    }
  };

  const handleVideoCall = () => {
    setIsVideoCallOpen(true);
  };

  // 发送图片消息（这里只做文本占位，实际应上传图片并传url）
  const handleSendImage = async () => {
    if (!currentChatId) return;
    try {
      await httpClient.post(API_ENDPOINTS.CHAT.SEND, {
        sender: currentUser?.email,
        receiver: currentChatId,
        content: '📷 [图片]',
        type: 'image',
        timestamp: Date.now(),
      });
      httpClient.get(API_ENDPOINTS.CHAT.MESSAGES, {
        user1: currentUser?.email,
        user2: currentChatId,
        limit: 100,
      }).then(res => {
        setMessages(res.data || []);
      });
    } catch (e) {
      alert(e.message || '图片消息发送失败');
    }
  };

  const handleSendVoice = () => {
    setIsVoiceChatOpen(true);
  };

  // 发送语音消息（audioUrl为音频文件url，实际应上传后端并传url）
  const handleVoiceMessageSent = async (audioUrl) => {
    if (!currentChatId || !audioUrl) return;
    try {
      await httpClient.post(API_ENDPOINTS.CHAT.SEND, {
        sender: currentUser?.email,
        receiver: currentChatId,
        content: audioUrl,
        type: 'audio',
        timestamp: Date.now(),
      });
      httpClient.get(API_ENDPOINTS.CHAT.MESSAGES, {
        user1: currentUser?.email,
        user2: currentChatId,
        limit: 100,
      }).then(res => {
        setMessages(res.data || []);
      });
      setIsVoiceChatOpen(false);
    } catch (e) {
      alert(e.message || '语音消息发送失败');
    }
  };

  const handleNavigateToFriends = () => {
    onNavigateToFriends();
  };

  const handleRefreshChat = () => {
    if (!currentChatId) return;
    httpClient.get(API_ENDPOINTS.CHAT.MESSAGES, {
      user1: currentUser?.email,
      user2: currentChatId,
      limit: 100,
    }).then(res => {
      setMessages(res.data || []);
    });
  };

  const handleSwitchChat = (chatId) => {
    setCurrentChatId(chatId);
    setIsChatListOpen(false);
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    backgroundImage: 'url("/ChatBack.png")',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minWidth: '1200px',
    width: '100vw',
    boxSizing: 'border-box',
  };

  const leftPanelStyle = {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.35)',
    minWidth: '600px',
    maxWidth: isChatListOpen ? 'calc(100vw - 350px)' : '100vw',
  };

  const rightPanelStyle = {
    width: '350px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: isChatListOpen ? 'flex' : 'none',
    flexDirection: 'column',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f8bbd9',
    boxShadow: '0 2px 4px rgba(233, 30, 99, 0.1)',
    minHeight: '70px',
    justifyContent: 'space-between',
  };

  const logoStyle = {
    width: '40px',
    height: '40px',
    backgroundColor: '#e91e63',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
    overflow: 'hidden',
  };

  const contactInfoStyle = {
    display: 'flex',
    alignItems: 'center',
  };

  const statusDotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: contactInfo.isOnline ? '#4caf50' : '#9e9e9e',
    marginLeft: '8px',
  };

  const navButtonStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '40px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.2s ease',
    margin: '0',
  };

  const navButtonsContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  };

  const chatAreaStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '0 20%',
  };

  const messagesScrollStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const chatListToggleStyle = {
    position: 'fixed',
    right: isChatListOpen ? 'calc(350px + 2vw)' : '2vw',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '50px',
    height: '50px',
    backgroundColor: '#e91e63',
    borderRadius: '25px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
    transition: 'all 0.3s ease',
    zIndex: 100,
    color: '#ffffff',
    fontSize: '18px',
  };

  const NavButton = ({ onClick, children, title, isActive = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <button
        style={{
          ...navButtonStyle,
          backgroundColor: isActive
            ? '#fce4ec'
            : isHovered
              ? '#f8bbd9'
              : 'transparent',
          color: isActive ? '#e91e63' : '#424242',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        title={title}
      >
        {children}
      </button>
    );
  };

  return (
    <div style={containerStyle}>
      {/* Left main chat area */}
      <div style={leftPanelStyle}>
        {/* Top bar */}
        <div style={headerStyle}>
          <div style={logoStyle}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
          </div>
          <div style={contactInfoStyle}>
            <span style={{ fontSize: '30px', fontWeight: '500', color: '#212529' }}>
              {contactInfo.name}
            </span>
            <div style={statusDotStyle}></div>
          </div>
          <div style={navButtonsContainerStyle}>
            <NavButton onClick={handleNavigateToFriends} title="好友列表">
              👥
            </NavButton>
            <NavButton onClick={handleRefreshChat} title="刷新聊天" isActive={true}>
              💬
            </NavButton>
            <NavButton
              onClick={() => {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
              }}
              title="退出登录"
            >
              🚪
            </NavButton>
          </div>
        </div>

        {/* Chat area */}
        <div style={chatAreaStyle}>
          <div style={messagesScrollStyle}>
            {messages.map((message, idx) => (
              <VideoBubble
                key={idx}
                message={message.type === 'audio' ? null : message.content}
                audioUrl={message.type === 'audio' ? message.content : null}
                isOwn={message.sender === currentUser?.email}
                timestamp={message.timestamp}
                avatar={message.avatar}
                type={message.type}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatInputBar
            onSendMessage={handleSendMessage}
            onVideoCall={handleVideoCall}
            onSendImage={handleSendImage}
            onSendVoice={handleSendVoice}
          />
        </div>
      </div>

      {/* Right ChatList panel */}
      <div style={rightPanelStyle}>
        <ChatListPage
          isVisible={true}
          onClose={() => setIsChatListOpen(false)}
          onSwitchChat={handleSwitchChat}
        />
      </div>

      {/* ChatList toggle button */}
      <button
        style={chatListToggleStyle}
        onClick={() => setIsChatListOpen(!isChatListOpen)}
        title={isChatListOpen ? "关闭消息列表" : "打开消息列表"}
      >
        {isChatListOpen ? '❯' : '❮'}
      </button>

      {/* Video call modal */}
      <VideoCallModal
        isOpen={isVideoCallOpen}
        onClose={() => setIsVideoCallOpen(false)}
        contactName={contactInfo.name}
      />

      {/* Voice chat modal */}
      <VoiceChatModal
        isOpen={isVoiceChatOpen}
        onClose={() => setIsVoiceChatOpen(false)}
        onSendVoice={handleVoiceMessageSent}
      />
    </div>
  );
};

export default ChatPage;