import React, { useState, useRef, useEffect } from 'react';

const VideoBubble = ({ message, audioUrl, isOwn, timestamp, avatar, type }) => {
  // --- 气泡及内容样式配置区域 ---
  // 以下定义了聊天气泡、内容容器、文本/语音内容、时间戳和头像的样式。
  // 这些样式共同决定了气泡的布局、颜色、大小和外观。

  // 气泡整体样式 (根据 isOwn 调整颜色和对齐)
  const bubbleStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: isOwn ? 'flex-end' : 'flex-start', // 根据是否是自己的消息决定左右对齐
    marginBottom: '12px', // 气泡之间的垂直间距
  };

  // 气泡内容容器样式
  const contentContainerStyle = {
    display: 'flex',
    flexDirection: 'column', // 内部元素垂直排列（内容和时间戳）
    alignItems: isOwn ? 'flex-end' : 'flex-start', // 根据是否是自己的消息决定内容对齐
    maxWidth: '70%', // 限制气泡的最大宽度，防止过长
  };

  // 气泡内容主体样式（文本或语音播放器所在的区域）
  const bubbleContentStyle = {
    backgroundColor: isOwn ? '#e91e63' : '#f0f0f0', // 自己发的消息用粉色，对方用灰色背景
    color: isOwn ? '#ffffff' : '#333333', // 文本颜色
    padding: '10px 15px', // 内容内边距
    borderRadius: '18px', // 圆角边框
    // 气泡尾部效果：通过调整特定角的圆角实现
    borderBottomLeftRadius: isOwn ? '18px' : '4px',
    borderBottomRightRadius: isOwn ? '4px' : '18px',
    position: 'relative', // 用于内部可能的定位元素
    wordBreak: 'break-word', // 长文本自动换行
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // 阴影效果
  };

  // 消息时间戳样式
  const timestampStyle = {
    fontSize: '10px', // 字体大小
    color: '#9e9e9e', // 颜色
    marginTop: '4px', // 顶部外边距
    marginRight: isOwn ? '8px' : '0', // 根据是否是自己的消息调整左右外边距
    marginLeft: isOwn ? '0' : '8px',
  };

  // 用户头像样式
  const avatarStyle = {
    width: '36px', // 宽度
    height: '36px', // 高度
    borderRadius: '50%', // 圆形头像
    objectFit: 'cover', // 图片填充方式
    margin: isOwn ? '0 0 0 8px' : '0 8px 0 0', // 根据是否是自己的消息调整左右外边距
  };

  // 语音播放器样式（当 type 为 'audio' 时应用）
  const audioPlayerStyle = {
    width: '90%',
    minWidth: '100px', // **调整这里：增加最小宽度以容纳图标和文本，避免溢出**
    height: '30px',
    backgroundColor: isOwn ? '#e91e63' : '#e0e0e0', // 播放器背景色
    borderRadius: '15px', // 圆角
    display: 'flex', // Flex 布局，用于排列播放图标和文本
    alignItems: 'center', // 垂直居中
    padding: '0 10px', // 内边距
    cursor: 'pointer', // 鼠标悬停时显示手型
    color: isOwn ? '#ffffff' : '#333333', // 文本颜色
  };

  // 播放/暂停图标样式
  const playIconStyle = {
    fontSize: '18px', // 字体大小
    marginRight: '8px', // 右侧外边距，与文本分隔
  };

  // --- 状态管理与逻辑 ---
  const audioRef = useRef(null); // 用于引用 <audio> 元素的 ref
  const [isPlaying, setIsPlaying] = useState(false); // 播放状态：true 表示正在播放，false 表示暂停

  // 切换播放/暂停功能
  const togglePlay = () => {
    if (audioRef.current) { // 确保 audio 元素存在
      if (isPlaying) {
        audioRef.current.pause(); // 如果正在播放，则暂停
      } else {
        audioRef.current.play(); // 如果已暂停，则播放
      }
      setIsPlaying(!isPlaying); // 切换播放状态
    }
  };

  // 监听音频播放结束事件，自动更新播放状态
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false); // 播放结束后设置 isPlaying 为 false
      audio.addEventListener('ended', handleEnded); // 添加事件监听器
      // 清理函数：组件卸载或 audio 元素改变时移除事件监听器，防止内存泄漏
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []); // 空依赖数组表示只在组件挂载和卸载时运行一次

  // --- 渲染逻辑 ---
  return (
    <div style={bubbleStyle}>
      {/* 如果不是自己的消息 (isOwn 为 false)，显示对方头像 */}
      {!isOwn && <img src={`/picture/${avatar}`} alt="Avatar" style={avatarStyle} />}
      <div style={contentContainerStyle}>
        <div style={bubbleContentStyle}>
          {/* 根据消息类型 (type) 渲染不同内容 */}
          {type === 'audio' ? (
            // 如果是语音消息，渲染自定义的语音播放器
            <div style={audioPlayerStyle} onClick={togglePlay}>
              <span style={playIconStyle}>{isPlaying ? '❚❚' : '▶'}</span> {/* 播放/暂停图标 */}
              {/* 显示语音消息文本和时间戳，或者可以只显示时长 */}
              <span>语音 ({timestamp})</span>
              {/* 隐藏的原生 audio 元素，用于实际播放音频 */}
              <audio ref={audioRef} src={audioUrl} preload="auto" />
            </div>
          ) : (
            // 如果是文本消息，直接显示消息内容
            message
          )}
        </div>
        {/* 显示消息时间戳 */}
        <div style={timestampStyle}>{timestamp}</div>
      </div>
      {/* 如果是自己的消息 (isOwn 为 true)，显示自己的头像 */}
      {isOwn && <img src={`/picture/${avatar}`} alt="Avatar" style={avatarStyle} />}
    </div>
  );
};

export default VideoBubble; // 导出 VideoBubble 组件
