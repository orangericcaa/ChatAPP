/**
 * WebSocket客户端管理类
 * 处理与后端WebSocket服务器的实时通信
 */

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3秒
    this.userId = null;
    this.eventHandlers = {};
    this.heartbeatInterval = null;
    
    // 绑定方法到实例
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * 连接到WebSocket服务器
   * @param {string} userId - 用户ID
   * @param {string} wsUrl - WebSocket服务器地址
   */
  async connect(userId, wsUrl = 'ws://localhost:8765') {
    if (this.isConnected) {
      console.log('WebSocket已连接');
      return;
    }

    this.userId = userId;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.handleOpen;
      this.ws.onmessage = this.handleMessage;
      this.ws.onclose = this.handleClose;
      this.ws.onerror = this.handleError;
      
      console.log(`正在连接WebSocket服务器: ${wsUrl}`);
      
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * WebSocket连接打开事件处理
   */
  handleOpen(event) {
    console.log('WebSocket连接已建立');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // 发送认证信息
    this.authenticate();
    
    // 启动心跳
    this.startHeartbeat();
    
    // 触发连接成功事件
    this.emit('connected');
  }

  /**
   * WebSocket消息接收事件处理
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('收到WebSocket消息:', message);
      
      // 根据消息类型处理
      switch (message.type) {
        case 'auth_success':
          console.log('WebSocket认证成功');
          this.emit('auth_success', message);
          break;
          
        case 'incoming_call':
          console.log('收到来电:', message);
          this.emit('incoming_call', message);
          break;
          
        case 'call_accepted':
          console.log('通话被接受:', message);
          this.emit('call_accepted', message);
          break;
          
        case 'call_rejected':
          console.log('通话被拒绝:', message);
          this.emit('call_rejected', message);
          break;
          
        case 'call_initiated':
          console.log('通话发起成功:', message);
          this.emit('call_initiated', message);
          break;
          
        case 'video_frame':
          // 处理视频帧数据
          this.emit('video_frame', message);
          break;
          
        case 'user_joined':
          console.log('用户加入通话:', message);
          this.emit('user_joined', message);
          break;
          
        case 'user_left':
          console.log('用户离开通话:', message);
          this.emit('user_left', message);
          break;
          
        case 'pong':
          // 心跳响应
          this.emit('pong', message);
          break;
          
        case 'error':
          console.error('WebSocket错误:', message.message);
          this.emit('error', message);
          break;
          
        default:
          console.log('未知消息类型:', message.type);
          this.emit('unknown_message', message);
      }
      
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
    }
  }

  /**
   * WebSocket连接关闭事件处理
   */
  handleClose(event) {
    console.log('WebSocket连接已关闭:', event.code, event.reason);
    this.isConnected = false;
    this.stopHeartbeat();
    
    // 触发断开连接事件
    this.emit('disconnected', { code: event.code, reason: event.reason });
    
    // 如果不是主动关闭，则尝试重连
    if (event.code !== 1000) { // 1000表示正常关闭
      this.scheduleReconnect();
    }
  }

  /**
   * WebSocket错误事件处理
   */
  handleError(error) {
    console.error('WebSocket错误:', error);
    this.emit('error', { error });
  }

  /**
   * 发送认证信息
   */
  authenticate() {
    if (!this.isConnected || !this.userId) return;
    
    this.send({
      type: 'auth',
      user_id: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发送消息到WebSocket服务器
   * @param {Object} message - 要发送的消息对象
   */
  send(message) {
    if (!this.isConnected || !this.ws) {
      console.error('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('发送WebSocket消息失败:', error);
      return false;
    }
  }

  /**
   * 发起视频通话
   * @param {string} calleeId - 被叫用户ID
   */
  initiateCall(calleeId) {
    return this.send({
      type: 'initiate_call',
      callee_id: calleeId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 接受视频通话
   * @param {string} sessionId - 会话ID
   */
  acceptCall(sessionId) {
    return this.send({
      type: 'accept_call',
      session_id: sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 拒绝视频通话
   * @param {string} sessionId - 会话ID
   * @param {string} callerId - 主叫用户ID
   */
  rejectCall(sessionId, callerId) {
    return this.send({
      type: 'reject_call',
      session_id: sessionId,
      caller_id: callerId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 挂断通话
   * @param {string} sessionId - 会话ID
   */
  hangUp(sessionId) {
    return this.send({
      type: 'hang_up',
      session_id: sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    this.stopHeartbeat(); // 确保不会重复启动
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, 30000); // 每30秒发送一次心跳
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`准备重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (!this.isConnected && this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectInterval);
  }

  /**
   * 断开WebSocket连接
   */
  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, '主动断开连接');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.userId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  off(event, handler) {
    if (!this.eventHandlers[event]) return;
    
    const index = this.eventHandlers[event].indexOf(handler);
    if (index > -1) {
      this.eventHandlers[event].splice(index, 1);
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (!this.eventHandlers[event]) return;
    
    this.eventHandlers[event].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`事件处理器错误 (${event}):`, error);
      }
    });
  }

  /**
   * 获取连接状态
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws ? this.ws.readyState : null
    };
  }
}

// 创建全局实例
const websocketClient = new WebSocketClient();

// 导出实例和类
export default websocketClient;
export { WebSocketClient };

// 导出连接状态常量
export const WEBSOCKET_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};
