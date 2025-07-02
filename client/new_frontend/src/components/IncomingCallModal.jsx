import React from 'react';
// 收到视频通话时的弹窗组件，UI参考VideoCallModal
// 参数：visible（是否显示）、callerName（来电人名）、onAccept（接听回调）、onReject（拒绝回调）
const IncomingCallModal = ({ visible, callerName, onAccept, onReject }) => {
  if (!visible) return null;
  return (
    <div className="modal-overlay">
      {/* 弹窗蒙层 */}
      <div className="modal-content">
        {/* 来电人信息 */}
        <h2>{callerName} 来电</h2>
        {/* 绿色接听按钮，点击后调用onAccept */}
        <button
          className="accept-btn"
          onClick={() => {
            // 这里实现接听电话的逻辑
            // TODO: 在这里实现接听电话的具体代码
            if (onAccept) onAccept();
          }}
        >
          接听
        </button>
        {/* 红色拒绝按钮，点击后调用onReject */}
        <button className="reject-btn" onClick={onReject}>
          拒绝
        </button>
      </div>
    </div>
  );
};

export default IncomingCallModal;
// 详细样式和动画可参考VideoCallModal，并在App.css中补充 