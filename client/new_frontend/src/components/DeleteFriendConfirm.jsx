import React from 'react';

const DeleteFriendConfirm = ({ isVisible, onClose, onConfirm, friendName }) => {
  if (!isVisible) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

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
    padding: '32px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333333',
    marginBottom: '16px',
  };

  const messageStyle = {
    fontSize: '14px',
    color: '#666666',
    marginBottom: '24px',
    lineHeight: '1.5',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  };

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f5f5f5',
    color: '#666666',
  };

  const confirmButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336',
    color: '#ffffff',
  };

  const FriendButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2196f3',
    color: '#ffffff',
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>删除好友</h3>
        <p style={messageStyle}>
          确定要删除好友 "{friendName}" 吗？<br />
          删除后将无法恢复聊天记录。
        </p>

        <div style={buttonContainerStyle}>
          <button style={cancelButtonStyle} onClick={onClose}>
            取消
          </button>
          <button style={confirmButtonStyle} onClick={handleConfirm}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteFriendConfirm;
