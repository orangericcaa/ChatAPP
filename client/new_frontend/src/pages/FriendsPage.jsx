import React, { useState, useEffect } from 'react';
import { httpClient } from '../../config/httpClient.js';
import { API_ENDPOINTS } from '../../config/api.js';
import NavButton from '../components/NavButton.jsx';
import FriendsList from '../components/FriendsList.jsx';
import FriendDetail from '../components/FriendDetail.jsx';
import FriendRequestNotification from '../components/FriendRequestNotification.jsx';

const FriendsPage = ({ onNavigateToChat, onSelectFriend, currentUser, onAvatarChange, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // 所有用户列表
  const [friendRequests, setFriendRequests] = useState([]); // 已发送的好友请求id
  const [receivedRequests, setReceivedRequests] = useState([]); // 收到的好友请求对象
  const [friendsList, setFriendsList] = useState([]);
  const [userInfo, setUserInfo] = useState(currentUser);

  // 页面加载时获取数据
  useEffect(() => {
    // 获取当前用户信息
    httpClient.get(API_ENDPOINTS.USER.PROFILE, { email: currentUser?.email })
      .then(res => setUserInfo(res.data))
      .catch(() => setUserInfo(null));
    // 获取好友列表
    httpClient.get(API_ENDPOINTS.FRIENDS.LIST, { email: currentUser?.email })
      .then(res => setFriendsList(res.data?.friends || []))
      .catch(() => setFriendsList([]));
    // 获取所有用户（用于全平台搜索）
    httpClient.get(API_ENDPOINTS.USER.SEARCH, { keyword: '' })
      .then(res => setAllUsers(res.data?.users || []))
      .catch(() => setAllUsers([]));
    // 获取收到的好友请求
    httpClient.get(API_ENDPOINTS.FRIENDS.REQUESTS, { email: currentUser?.email })
      .then(res => setReceivedRequests(res.data?.requests || []))
      .catch(() => setReceivedRequests([]));
  }, [currentUser]);

  // 个人信息显示
  const contactInfo = {
    name: userInfo?.name || "当前用户",
    isOnline: true,
  };

  // 事件处理函数
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = allUsers.filter(user =>
        user.name.includes(query) ||
        user.email.includes(query)
      );
      setSearchResults(results);
      setShowSearchResults(true);

      if (results.length === 0) {
        alert('该用户不存在');
      } else if (results.length > 0) {
        setSelectedFriend(results[0]);
      }
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend);
    setShowSearchResults(false);
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  const handleSendMessage = (friend) => {
    if (!friend) return;
    setActiveChat(friend);
    onSelectFriend(friend);
    onNavigateToChat(); // 调用从 props 传入的导航函数
  };

  // 添加好友
  const handleAddFriend = async (friend) => {
    if (!friend) return;
    if (friendRequests.includes(friend.email)) {
      alert('好友请求已发送，请等待对方确认');
      return;
    }
    try {
      await httpClient.post(API_ENDPOINTS.FRIENDS.ADD, {
        inviter: currentUser.email,
        invitee: friend.email,
      });
      setFriendRequests([...friendRequests, friend.email]);
      alert(`已向 ${friend.name} 发送好友申请`);
      // 临时模拟收到好友请求（如后端未实现可保留）
      setReceivedRequests(prev => [...prev, {
        id: Date.now(),
        from: friend,
        name: friend.name,
        email: friend.email,
      }]);
    } catch (e) {
      alert(e.message || '发送好友申请失败');
    }
  };

  // 通过好友请求
  const handleAcceptRequest = async (request) => {
    try {
      if (request.id) {
        await httpClient.post(API_ENDPOINTS.FRIENDS.ACCEPT, {
          inviter: request.from.email,
          invitee: currentUser.email,
        });
      }
      setFriendsList(prev => [
        ...prev,
        { ...request.from, isFriend: true }
      ]);
      setReceivedRequests(prev => prev.filter(r => r.id !== request.id));
      alert(`已添加 ${request.name} 为好友`);
    } catch (e) {
      alert(e.message || '操作失败');
    }
  };

  // 拒绝好友请求
  const handleRejectRequest = async (request) => {
    try {
      if (request.id) {
        await httpClient.post(API_ENDPOINTS.FRIENDS.REJECT, {
          inviter: request.from.email,
          invitee: currentUser.email,
        });
      }
      setReceivedRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (e) {
      alert(e.message || '操作失败');
    }
  };

  // 响应式样式定义
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#fce4ec',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minWidth: '320px',
    boxSizing: 'border-box',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '1vw 2vw',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f8bbd9',
    boxShadow: '0 2px 4px rgba(233, 30, 99, 0.1)',
    minHeight: '60px',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  };

  const logoStyle = {
    width: 'clamp(35px, 4vw, 50px)',
    height: 'clamp(35px, 4vw, 50px)',
    backgroundColor: '#e91e63',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '1rem',
    overflow: 'hidden',
  };

  const contactInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: '1',
    minWidth: '120px',
  };

  const statusDotStyle = (isOnline) => ({
    width: 'clamp(6px, 1vw, 10px)',
    height: 'clamp(6px, 1vw, 10px)',
    borderRadius: '50%',
    backgroundColor: isOnline ? '#4caf50' : '#9e9e9e',
  });

  const navButtonsContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(10px, 1.5vw, 20px)',
    flexWrap: 'wrap',
  };

  const mainContentStyle = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
    gap: '1px',
  };

  const responsiveTextStyle = {
    fontSize: 'clamp(14px, 2vw, 18px)',
    fontWeight: '500',
    color: 'rgb(2, 0, 0)',
  };

  return (
    <div style={containerStyle}>
      {/* 顶部栏 */}
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
          <span style={responsiveTextStyle}>
            {contactInfo.name}
          </span>
          <div style={statusDotStyle(contactInfo.isOnline)}></div>
        </div>
        <div style={navButtonsContainerStyle}>
          <NavButton
            onClick={handleRefreshPage}
            title="好友列表"
            isActive={true}
          >
            👥
          </NavButton>
          <NavButton
            onClick={onNavigateToChat}
            title="聊天页面"
          >
            💬
          </NavButton>
          <NavButton
            onClick={onLogout}
            title="退出登录"
          >
            🚪
          </NavButton>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={mainContentStyle}>
        {/* 左侧面板 - 好友列表 */}
        <FriendsList
          friends={showSearchResults ? searchResults : friendsList}
          selectedFriend={selectedFriend}
          onFriendSelect={handleFriendSelect}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
        />

        {/* 右侧面板 - 好友详情 */}
        <FriendDetail
          selectedFriend={selectedFriend}
          onSendMessage={() => handleSendMessage(selectedFriend)}
          onVideoCall={() => {}}
          onAvatarChange={onAvatarChange}
          friendRequests={friendRequests}
          onAddFriend={handleAddFriend}
        />
      </div>

      <FriendRequestNotification
        requests={receivedRequests}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
      />
    </div>
  );
};

export default FriendsPage;