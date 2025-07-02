// config/websocketClient.js
// WebSocket客户端封装

import API_CONFIG, { WEBSOCKET_URLS } from './api.js';

class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: API_CONFIG.WEBSOCKET.RECONNECT_INTERVAL,
      maxReconnectAttempts: API_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS,
      ...options,
    };
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.isConnecting = false;
    this.isClosed = false;
    
    // 事件处理器
    this.eventHandlers = {
      open: [],
      message: [],
      error: [],
      close: [],
    };
  }

  // 连接WebSocket
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.isClosed = false;

    try {
      // 添加认证token到URL
      const token = localStorage.getItem('authToken');
      const urlWithAuth = token ? `${this.url}?token=${encodeURIComponent(token)}` : this.url;
      
      this.ws = new WebSocket(urlWithAuth);
      
      // 连接成功
      this.ws.onopen = (event) => {
        console.log('WebSocket连接成功:', this.url);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.clearReconnectTimer();
        this.emit('open', event);
      };
      
      // 接收消息
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
          this.emit('message', event.data);
        }
      };
      
      // 连接错误
      this.ws.onerror = (event) => {
        console.error('WebSocket连接错误:', event);
        this.isConnecting = false;
        this.emit('error', event);
      };
      
      // 连接关闭
      this.ws.onclose = (event) => {
        console.log('WebSocket连接关闭:', event.code, event.reason);
        this.isConnecting = false;
        this.emit('close', event);
        
        // 如果不是主动关闭，尝试重连
        if (!this.isClosed && this.reconnectAttempts < this.options.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  // 发送消息
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } else {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }
  }

  // 关闭连接
  close() {
    this.isClosed = true;
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 添加事件监听器
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  // 移除事件监听器
  off(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  // 触发事件
  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`WebSocket事件处理器错误 (${event}):`, error);
        }
      });
    }
  }

  // 计划重连
  scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`WebSocket将在${delay}ms后进行第${this.reconnectAttempts}次重连尝试`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  // 清除重连定时器
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // 获取连接状态
  getReadyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  // 检查是否已连接
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// 创建预配置的WebSocket客户端实例
export const createChatWebSocket = (options = {}) => {
  return new WebSocketClient(WEBSOCKET_URLS.CHAT, options);
};

export const createRTCWebSocket = (options = {}) => {
  return new WebSocketClient(WEBSOCKET_URLS.RTC, options);
};

export const createNotificationWebSocket = (options = {}) => {
  return new WebSocketClient(WEBSOCKET_URLS.NOTIFICATION, options);
};

export default WebSocketClient;