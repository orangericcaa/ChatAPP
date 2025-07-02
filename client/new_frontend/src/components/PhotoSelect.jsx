import React, { useState } from 'react';

const PhotoSelect = ({ isVisible, onClose, currentAvatar, onAvatarChange }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  // 头像列表（picture文件夹中的图片）
  const avatarList = [
    '1.png', '2.png', '3.png', '4.png', '5.png',
    '6.png', '7.png', '8.jpg', '9.jpg', '10.jpg'
  ];

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleConfirm = () => {
    onAvatarChange(selectedAvatar);
    onClose();
  };

  const handleCancel = () => {
    setSelectedAvatar(currentAvatar);
    onClose();
  };

  if (!isVisible) return null;

  // 样式定义
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#e91e63',
    marginBottom: '20px',
    textAlign: 'center',
  };

  const avatarGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '8px',
  };

  const avatarItemStyle = {
    position: 'relative',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '3px solid transparent',
    transition: 'all 0.2s ease',
  };

  const selectedAvatarStyle = {
    ...avatarItemStyle,
    border: '3px solid #e91e63',
    transform: 'scale(1.05)',
  };

  const avatarImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const checkmarkStyle = {
    position: 'absolute',
    top: '5px',
    right: '5px',
    width: '24px',
    height: '24px',
    backgroundColor: '#4caf50',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f5f5f5',
    color: '#666666',
  };

  const confirmButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e91e63',
    color: '#ffffff',
  };

  return (
    <div style={overlayStyle} onClick={handleCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>选择头像</h3>

        <div style={avatarGridStyle}>
          {avatarList.map((avatar) => (
            <div
              key={avatar}
              style={selectedAvatar === avatar ? selectedAvatarStyle : avatarItemStyle}
              onClick={() => handleAvatarSelect(avatar)}
            >
              <img
                src={`/picture/${avatar}`}
                alt={`头像 ${avatar}`}
                style={avatarImageStyle}
              />
              {selectedAvatar === avatar && (
                <div style={checkmarkStyle}>
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={buttonContainerStyle}>
          <button style={cancelButtonStyle} onClick={handleCancel}>
            取消
          </button>
          <button style={confirmButtonStyle} onClick={handleConfirm}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoSelect;
