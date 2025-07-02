// import React, { useState } from 'react';

// const VideoCallModal = ({ isOpen, onClose, contactName = "好友" }) => {
//   const [isHovered, setIsHovered] = useState(false);

//   if (!isOpen) return null;

//   const overlayStyle = {
//     position: 'fixed',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(233, 30, 99, 0.8)',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 1000,
//   };

//   const modalStyle = {
//     width: '90%',
//     maxWidth: '600px',
//     height: '80%',
//     maxHeight: '500px',
//     backgroundColor: '#2d2d2d',
//     borderRadius: '16px',
//     overflow: 'hidden',
//     display: 'flex',
//     flexDirection: 'column',
//     boxShadow: '0 20px 40px rgba(233, 30, 99, 0.3)',
//   };

//   const headerStyle = {
//     padding: '20px',
//     backgroundColor: '#e91e63',
//     color: '#ffffff',
//     textAlign: 'center',
//     fontSize: '18px',
//     fontWeight: '500',
//     borderBottom: '1px solid #f8bbd9',
//   };

//   const videoAreaStyle = {
//     flex: 1,
//     backgroundColor: '#f8bbd9',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//     color: '#e91e63',
//     fontSize: '16px',
//   };

//   const controlsStyle = {
//     padding: '20px',
//     backgroundColor: '#ffffff',
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//   };

//   const hangupButtonStyle = {
//     width: '60px',
//     height: '60px',
//     borderRadius: '50%',
//     border: 'none',
//     backgroundColor: '#e91e63',
//     color: '#ffffff',
//     cursor: 'pointer',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '24px',
//     transition: 'all 0.2s ease',
//     transform: isHovered ? 'scale(1.05)' : 'scale(1)',
//     boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
//   };

//   const hangupButtonHoverStyle = {
//     backgroundColor: '#c2185b',
//     boxShadow: '0 6px 16px rgba(233, 30, 99, 0.4)',
//   };

//   return (
//     <div style={overlayStyle} onClick={onClose}>
//       <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
//         <div style={headerStyle}>
//           与 {contactName} 的视频通话
//         </div>

//         <div style={videoAreaStyle}>
//           <div style={{ textAlign: 'center' }}>
//             <div style={{
//               width: '120px',
//               height: '120px',
//               borderRadius: '50%',
//               backgroundColor: '#ffffff',
//               margin: '0 auto 16px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: '48px',
//               color: '#e91e63',
//             }}>
//               📹
//             </div>
//             <div>视频通话进行中...</div>
//           </div>
//         </div>

//         <div style={controlsStyle}>
//           <button
//             style={{
//               ...hangupButtonStyle,
//               ...(isHovered ? hangupButtonHoverStyle : {}),
//             }}
//             onMouseEnter={() => setIsHovered(true)}
//             onMouseLeave={() => setIsHovered(false)}
//             onClick={onClose}
//             title="挂断"
//           >
//             <img
//               src="/电话.svg"
//               alt="电话图标" // 始终添加 alt 属性以提高可访问性
//               style={{
//                 width: '80%',     // 使图片宽度填充父元素
//                 heght: '80%',    // 使图片高度填充父元素
//                 // objectFit: 'contain', // 确保图片按比例缩放，并完全显示在容器内，不裁剪
//                 // padding: '10px'     // 可选：添加一些内边距，让图标距离圆框边缘有一些空间
//               }}
//             />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoCallModal;

import React, { useState } from 'react';

const VideoCallModal = ({ isOpen, onClose, contactName = "好友" }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(141, 137, 138, 0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    width: '90%',
    maxWidth: '600px',
    height: '80%',
    maxHeight: '500px',
    backgroundColor: '#2d2d2d',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(233, 30, 99, 0.3)',
  };

  const headerStyle = {
    padding: '20px',
    backgroundColor: '#e91e63',
    color: '#ffffff',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: '500',
    borderBottom: '1px solid #f8bbd9',
  };

  const videoAreaStyle = {
    flex: 1,
    backgroundColor: '#f8bbd9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    color: '#e91e63',
    fontSize: '16px',
  };

  const controlsStyle = {
    padding: '20px',
    backgroundColor: '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const hangupButtonStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#e91e63',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    transition: 'all 0.2s ease',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
    padding: 0, // 移除padding，让图标有更多空间
  };

  const hangupButtonHoverStyle = {
    backgroundColor: '#c2185b',
    boxShadow: '0 6px 16px rgba(233, 30, 99, 0.4)',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          与 {contactName} 的视频通话
        </div>

        <div style={videoAreaStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: '#e91e63',
            }}>
              📹
            </div>
            <div>视频通话进行中...</div>
          </div>
        </div>

        <div style={controlsStyle}>
          <button
            style={{
              ...hangupButtonStyle,
              ...(isHovered ? hangupButtonHoverStyle : {}),
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClose}
            title="挂断"
          >
            <img
              src="/电话.svg"
              alt="电话图标"
              style={{
                width: '28px', // 固定宽度，确保图标大小合适
                height: '28px', // 固定高度，确保图标大小合适
                objectFit: 'contain', // 保持图标比例
                filter: 'brightness(0) invert(1)', // 将SVG图标变为白色
                display: 'block', // 确保图标正确显示
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
