// config/api.js
// 后端API端口配置文件

// 基础配置
const API_CONFIG = {
  // 后端服务器基础URL
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost',
  
  // 端口配置
  PORTS: {
    // 主API服务端口
    MAIN_API: 3001,
    
    // 用户认证服务端口
    AUTH_SERVICE: 3002,
    
    // 聊天消息服务端口（WebSocket）
    CHAT_SERVICE: 3003,
    
    // 文件上传服务端口
    FILE_SERVICE: 3004,
    
    // 实时通信服务端口（视频通话等）
    RTC_SERVICE: 3005,
    
    // 通知推送服务端口
    NOTIFICATION_SERVICE: 3006,
  },
  
  // API版本
  API_VERSION: 'v1',
  
  // 请求超时时间（毫秒）
  TIMEOUT: 10000,
  
  // WebSocket配置
  WEBSOCKET: {
    RECONNECT_INTERVAL: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
  }
};

// 构建完整的API端点URL
const buildApiUrl = (service, endpoint = '') => {
  const port = API_CONFIG.PORTS[service];
  if (!port) {
    throw new Error(`Unknown service: ${service}`);
  }
  
  const baseUrl = `${API_CONFIG.BASE_URL}:${port}/api/${API_CONFIG.API_VERSION}`;
  return endpoint ? `${baseUrl}/${endpoint}` : baseUrl;
};

// 预定义的API端点
export const API_ENDPOINTS = {
  // 用户认证相关
  AUTH: {
    LOGIN: buildApiUrl('AUTH_SERVICE', 'login'),
    REGISTER: buildApiUrl('AUTH_SERVICE', 'register'),
    LOGOUT: buildApiUrl('AUTH_SERVICE', 'logout'),
    VERIFY_TOKEN: buildApiUrl('AUTH_SERVICE', 'verify'),
    REFRESH_TOKEN: buildApiUrl('AUTH_SERVICE', 'refresh'),
  },
  
  // 用户信息相关
  USER: {
    PROFILE: buildApiUrl('MAIN_API', 'user/profile'),
    UPDATE_AVATAR: buildApiUrl('MAIN_API', 'user/avatar'),
    UPDATE_INFO: buildApiUrl('MAIN_API', 'user/info'),
    SEARCH: buildApiUrl('MAIN_API', 'user/search'),
  },
  
  // 好友管理相关
  FRIENDS: {
    LIST: buildApiUrl('MAIN_API', 'friends'),
    ADD: buildApiUrl('MAIN_API', 'friends/add'),
    DELETE: buildApiUrl('MAIN_API', 'friends/delete'),
    REQUESTS: buildApiUrl('MAIN_API', 'friends/requests'),
    ACCEPT: buildApiUrl('MAIN_API', 'friends/accept'),
    REJECT: buildApiUrl('MAIN_API', 'friends/reject'),
  },
  
  // 聊天消息相关
  CHAT: {
    MESSAGES: buildApiUrl('CHAT_SERVICE', 'messages'),
    SEND: buildApiUrl('CHAT_SERVICE', 'send'),
    HISTORY: buildApiUrl('CHAT_SERVICE', 'history'),
    DELETE: buildApiUrl('CHAT_SERVICE', 'delete'),
    MARK_READ: buildApiUrl('CHAT_SERVICE', 'mark-read'),
  },
  
  // 文件上传相关
  FILE: {
    UPLOAD_IMAGE: buildApiUrl('FILE_SERVICE', 'upload/image'),
    UPLOAD_VOICE: buildApiUrl('FILE_SERVICE', 'upload/voice'),
    UPLOAD_VIDEO: buildApiUrl('FILE_SERVICE', 'upload/video'),
    DOWNLOAD: buildApiUrl('FILE_SERVICE', 'download'),
  },
  
  // 实时通信相关
  RTC: {
    INITIATE_CALL: buildApiUrl('RTC_SERVICE', 'call/initiate'),
    ACCEPT_CALL: buildApiUrl('RTC_SERVICE', 'call/accept'),
    REJECT_CALL: buildApiUrl('RTC_SERVICE', 'call/reject'),
    END_CALL: buildApiUrl('RTC_SERVICE', 'call/end'),
  },
  
  // 通知相关
  NOTIFICATION: {
    LIST: buildApiUrl('NOTIFICATION_SERVICE', 'notifications'),
    MARK_READ: buildApiUrl('NOTIFICATION_SERVICE', 'mark-read'),
    SETTINGS: buildApiUrl('NOTIFICATION_SERVICE', 'settings'),
  },
};

// WebSocket连接地址
export const WEBSOCKET_URLS = {
  CHAT: `ws://${API_CONFIG.BASE_URL.replace('http://', '')}:${API_CONFIG.PORTS.CHAT_SERVICE}/ws/chat`,
  RTC: `ws://${API_CONFIG.BASE_URL.replace('http://', '')}:${API_CONFIG.PORTS.RTC_SERVICE}/ws/rtc`,
  NOTIFICATION: `ws://${API_CONFIG.BASE_URL.replace('http://', '')}:${API_CONFIG.PORTS.NOTIFICATION_SERVICE}/ws/notification`,
};

// 导出配置
export default API_CONFIG;
export { buildApiUrl };