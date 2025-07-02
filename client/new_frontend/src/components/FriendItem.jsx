import React, { useState } from 'react';

const FriendItem = ({ friend, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  const friendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #fce4ec',
    transition: 'background-color 0.2s ease',
  };

  const friendItemHoverStyle = {
    backgroundColor: '#fce4ec',
  };

  const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0,
    overflow: 'hidden',
    border: friend.isSelf ? '2px solid #e91e63' : '2px solid #f8bbd9',
  };

  const avatarImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const friendInfoStyle = {
    flex: 1,
    minWidth: 0,
  };

  const friendNameStyle = {
    fontSize: '15px',
    fontWeight: '500',
    color: '#212529',
    marginBottom: '2px',
  };

  const friendAccountStyle = {
    fontSize: '12px',
    color: '#ad7a99',
  };

  return (
    <div
      style={{
        ...friendItemStyle,
        ...(isHovered ? friendItemHoverStyle : {}),
        backgroundColor: isSelected ? '#fce4ec' : 'transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(friend)}
    >
      <div style={avatarStyle}>
        <img
          src={`/picture/${friend.avatar}`}
          alt={friend.name}
          style={avatarImageStyle}
        />
      </div>
      <div style={friendInfoStyle}>
        <div style={friendNameStyle}>{friend.name}</div>
        <div style={friendAccountStyle}>@{friend.account}</div>
      </div>
    </div>
  );
};

export default FriendItem;
