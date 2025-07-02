import React from 'react';
import FriendItem from './FriendItem.jsx';

const FriendsList = ({ friends, selectedFriend, onFriendSelect, searchQuery, onSearchChange }) => {
  const leftPanelStyle = {
    width: '40%',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #f8bbd9',
    display: 'flex',
    flexDirection: 'column',
  };

  const searchBarStyle = {
    padding: '16px',
    borderBottom: '1px solid #f8bbd9',
  };

  const searchInputStyle = {
    width: '80%',
    padding: '12px 16px',
    border: '1px solid #f8bbd9',
    borderRadius: '20px',
    fontSize: '14px',
    outline: 'none',
    marginLeft: '10%',
    marginRight: '10%',
    backgroundColor: '#fce4ec',
    transition: 'border-color 0.2s ease',
  };

  const friendsListStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  };

  return (
    <div style={leftPanelStyle}>
      {/* 搜索栏 */}
      <div style={searchBarStyle}>
        <input
          style={searchInputStyle}
          type="text"
          placeholder="搜索好友..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={(e) => e.target.style.borderColor = '#e91e63'}
          onBlur={(e) => e.target.style.borderColor = '#f8bbd9'}
        />
      </div>

      {/* 好友列表 */}
      <div style={friendsListStyle}>
        {friends.map((friend) => (
          <FriendItem
            key={friend.id}
            friend={friend}
            isSelected={selectedFriend?.id === friend.id}
            onSelect={onFriendSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default FriendsList;