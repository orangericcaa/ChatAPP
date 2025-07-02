// FriendRequestNotification.jsx
import React from 'react';

const FriendRequestNotification = ({ requests, onAccept, onReject }) => {
  if (!requests.length) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '16px',
      width: '300px'
    }}>
      <h4>好友请求</h4>
      {requests.map(request => (
        <div key={request.id} style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 0',
          borderBottom: '1px solid #eee'
        }}>
          <img 
            src={`/picture/${request.avatar}`} 
            alt={request.name}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              marginRight: '12px'
            }}
          />
          <div style={{flex: 1}}>
            <div style={{fontWeight: '500'}}>{request.name}</div>
            <div style={{fontSize: '12px', color: '#666'}}>@{request.account}</div>
          </div>
          <button 
            onClick={() => onAccept(request)}
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              marginRight: '8px',
              cursor: 'pointer'
            }}
          >
            接受
          </button>
          <button 
            onClick={() => onReject(request)}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            拒绝
          </button>
        </div>
      ))}
    </div>
  );
};

export default FriendRequestNotification;