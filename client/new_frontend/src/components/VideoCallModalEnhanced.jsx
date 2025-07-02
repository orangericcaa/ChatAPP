import React, { useState, useEffect, useRef } from 'react';
import websocketClient from '../utils/websocket.js';

const VideoCallModalEnhanced = ({ 
  isOpen, 
  onClose, 
  contactName = "好友",
  contactId,
  currentUserId,
  callType = 'outgoing' // 'outgoing', 'incoming'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [callState, setCallState] = useState('idle'); // idle, calling, connected, ended
  const [sessionId, setSessionId] = useState(null);
  const [remoteVideoData, setRemoteVideoData] = useState(null);
  const [localVideoStream, setLocalVideoStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // 初始化WebSocket连接
  useEffect(() => {
    if (isOpen && currentUserId) {
      initializeWebSocket();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen, currentUserId]);

  // 处理通话类型
  useEffect(() => {
    if (isOpen) {
      if (callType === 'outgoing') {
        initiateCall();
      } else if (callType === 'incoming') {
        setCallState('incoming');
      }
    }
  }, [isOpen, callType, contactId]);

  // 通话计时器
  useEffect(() => {
    if (callState === 'connected' && !durationIntervalRef.current) {
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    } else if (callState !== 'connected' && durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, [callState]);

  const initializeWebSocket = async () => {
    try {
      if (!websocketClient.isConnected) {
        await websocketClient.connect(currentUserId);
      }

      // 注册事件监听器
      websocketClient.on('call_initiated', handleCallInitiated);
      websocketClient.on('call_accepted', handleCallAccepted);
      websocketClient.on('call_rejected', handleCallRejected);
      websocketClient.on('incoming_call', handleIncomingCall);
      websocketClient.on('video_frame', handleVideoFrame);
      websocketClient.on('user_joined', handleUserJoined);
      websocketClient.on('user_left', handleUserLeft);
      websocketClient.on('error', handleWebSocketError);

    } catch (error) {
      console.error('WebSocket初始化失败:', error);
      setCallState('error');
    }
  };

  const initiateCall = () => {
    if (!contactId || !websocketClient.isConnected) {
      console.error('无法发起通话：缺少联系人ID或WebSocket未连接');
      return;
    }

    setCallState('calling');
    setIsConnecting(true);
    websocketClient.initiateCall(contactId);
  };

  const acceptCall = () => {
    if (sessionId) {
      setCallState('connecting');
      websocketClient.acceptCall(sessionId);
      startLocalVideo();
    }
  };

  const rejectCall = () => {
    if (sessionId) {
      websocketClient.rejectCall(sessionId, contactId);
    }
    setCallState('ended');
    setTimeout(() => onClose(), 1000);
  };

  const hangUp = () => {
    if (sessionId) {
      websocketClient.hangUp(sessionId);
    }
    setCallState('ended');
    stopLocalVideo();
    setTimeout(() => onClose(), 1000);
  };

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalVideoStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('获取本地视频流失败:', error);
    }
  };

  const stopLocalVideo = () => {
    if (localVideoStream) {
      localVideoStream.getTracks().forEach(track => track.stop());
      setLocalVideoStream(null);
    }
  };

  // WebSocket事件处理器
  const handleCallInitiated = (data) => {
    setSessionId(data.session_id);
    setCallState('calling');
  };

  const handleCallAccepted = (data) => {
    setCallState('connected');
    setIsConnecting(false);
    startLocalVideo();
  };

  const handleCallRejected = (data) => {
    setCallState('rejected');
    setIsConnecting(false);
    setTimeout(() => onClose(), 2000);
  };

  const handleIncomingCall = (data) => {
    setSessionId(data.session_id);
    setCallState('incoming');
  };

  const handleVideoFrame = (data) => {
    // 处理接收到的视频帧数据
    if (data.session_id === sessionId) {
      try {
        // 这里需要实现视频帧的解码和显示
        // 由于浏览器安全限制，直接处理二进制视频流比较复杂
        // 在实际项目中，可能需要使用WebRTC或其他方案
        setRemoteVideoData(data.data);
        displayRemoteVideo(data.data);
      } catch (error) {
        console.error('处理视频帧失败:', error);
      }
    }
  };

  const handleUserJoined = (data) => {
    console.log('用户加入通话:', data);
    if (callState === 'calling') {
      setCallState('connected');
      setIsConnecting(false);
    }
  };

  const handleUserLeft = (data) => {
    console.log('用户离开通话:', data);
    setCallState('ended');
    setTimeout(() => onClose(), 1000);
  };

  const handleWebSocketError = (data) => {
    console.error('WebSocket错误:', data);
    setCallState('error');
  };

  const displayRemoteVideo = (videoData) => {
    // 简化的视频显示 - 在实际项目中需要更复杂的处理
    if (remoteVideoRef.current && videoData) {
      // 这里可以使用Canvas或其他方式显示视频帧
      // 由于是demo，我们暂时用占位符
      console.log('显示远程视频帧');
    }
  };

  const cleanup = () => {
    // 清理WebSocket事件监听器
    websocketClient.off('call_initiated', handleCallInitiated);
    websocketClient.off('call_accepted', handleCallAccepted);
    websocketClient.off('call_rejected', handleCallRejected);
    websocketClient.off('incoming_call', handleIncomingCall);
    websocketClient.off('video_frame', handleVideoFrame);
    websocketClient.off('user_joined', handleUserJoined);
    websocketClient.off('user_left', handleUserLeft);
    websocketClient.off('error', handleWebSocketError);

    // 停止本地视频
    stopLocalVideo();

    // 清理计时器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStateText = () => {
    switch (callState) {
      case 'calling':
        return '正在呼叫...';
      case 'incoming':
        return '来电中...';
      case 'connecting':
        return '正在连接...';
      case 'connected':
        return `通话中 ${formatDuration(callDuration)}`;
      case 'rejected':
        return '通话被拒绝';
      case 'ended':
        return '通话已结束';
      case 'error':
        return '连接失败';
      default:
        return '';
    }
  };

  const getCallStateColor = () => {
    switch (callState) {
      case 'connected':
        return '#4caf50';
      case 'rejected':
      case 'ended':
      case 'error':
        return '#f44336';
      default:
        return '#e91e63';
    }
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 251, 120, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    width: '90%',
    maxWidth: '800px',
    height: '80%',
    maxHeight: '600px',
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

  const statusStyle = {
    fontSize: '14px',
    color: getCallStateColor(),
    marginTop: '5px',
  };

  const videoAreaStyle = {
    flex: 1,
    backgroundColor: '#1a1a1a',
    display: 'flex',
    position: 'relative',
    minHeight: '400px',
  };

  const remoteVideoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#333',
  };

  const localVideoStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '200px',
    height: '150px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '2px solid #e91e63',
    backgroundColor: '#333',
  };

  const placeholderStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    color: '#ffffff',
    backgroundColor: '#333',
  };

  const controlsStyle = {
    padding: '20px',
    backgroundColor: '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  };

  const buttonStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    transition: 'all 0.2s ease',
  };

  const hangupButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336',
    color: '#ffffff',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
  };

  const acceptButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4caf50',
    color: '#ffffff',
  };

  const rejectButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336',
    color: '#ffffff',
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div>与 {contactName} 的视频通话</div>
          <div style={statusStyle}>{getCallStateText()}</div>
        </div>

        <div style={videoAreaStyle}>
          {/* 远程视频 */}
          {remoteVideoData ? (
            <video
              ref={remoteVideoRef}
              style={remoteVideoStyle}
              autoPlay
              playsInline
              muted={false}
            />
          ) : (
            <div style={placeholderStyle}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#e91e63',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: '#ffffff',
              }}>
                📹
              </div>
              <div>{getCallStateText()}</div>
            </div>
          )}

          {/* 本地视频 */}
          {localVideoStream && (
            <video
              ref={localVideoRef}
              style={localVideoStyle}
              autoPlay
              playsInline
              muted={true}
            />
          )}
        </div>

        <div style={controlsStyle}>
          {callState === 'incoming' ? (
            <>
              <button
                style={acceptButtonStyle}
                onClick={acceptCall}
                title="接听"
              >
                📞
              </button>
              <button
                style={rejectButtonStyle}
                onClick={rejectCall}
                title="拒绝"
              >
                📵
              </button>
            </>
          ) : (
            <button
              style={hangupButtonStyle}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={hangUp}
              title="挂断"
            >
              📞
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallModalEnhanced;
