// config/env.js
// 环境变量配置读取

// 从环境变量中读取配置，提供默认值
export const ENV_CONFIG = {
  // 基础配置
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  
  // API服务器配置
  API: {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost',
    PRODUCTION_DOMAIN: import.meta.env.VITE_PRODUCTION_DOMAIN || 'https://your-domain.com',
    VERSION: import.meta.env.VITE_API_VERSION || 'v1',
    TIMEOUT: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 10000,
    
    PORTS: {
      MAIN_API: parseInt(import.meta.env.VITE_API_MAIN_PORT) || 3001,
      AUTH_SERVICE: parseInt(import.meta.env.VITE_API_AUTH_PORT) || 3002,
      CHAT_SERVICE: parseInt(import.meta.env.VITE_API_CHAT_PORT) || 3003,
      FILE_SERVICE: parseInt(import.meta.env.VITE_API_FILE_PORT) || 3004,
      RTC_SERVICE: parseInt(import.meta.env.VITE_API_RTC_PORT) || 3005,
      NOTIFICATION_SERVICE: parseInt(import.meta.env.VITE_API_NOTIFICATION_PORT) || 3006,
    },
  },
  
  // WebSocket配置
  WEBSOCKET: {
    RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_WS_RECONNECT_INTERVAL) || 3000,
    MAX_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5,
  },
  
  // 文件上传配置
  FILE_UPLOAD: {
    MAX_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
    ALLOWED_TYPES: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,audio/mp3,audio/wav,video/mp4').split(','),
  },
  
  // 功能开关
  FEATURES: {
    VIDEO_CALL: import.meta.env.VITE_ENABLE_VIDEO_CALL !== 'false',
    VOICE_MESSAGE: import.meta.env.VITE_ENABLE_VOICE_MESSAGE !== 'false',
    FILE_SHARE: import.meta.env.VITE_ENABLE_FILE_SHARE !== 'false',
  },
};

// 获取当前环境的API基础URL
export const getApiBaseUrl = () => {
  return ENV_CONFIG.NODE_ENV === 'production' 
    ? ENV_CONFIG.API.PRODUCTION_DOMAIN 
    : ENV_CONFIG.API.BASE_URL;
};

// 构建API端点URL
export const buildApiEndpoint = (service, endpoint = '') => {
  const baseUrl = getApiBaseUrl();
  const port = ENV_CONFIG.API.PORTS[service];
  
  if (!port) {
    throw new Error(`Unknown service: ${service}`);
  }
  
  const apiUrl = ENV_CONFIG.NODE_ENV === 'production'
    ? `${baseUrl}/api/${ENV_CONFIG.API.VERSION}/${service.toLowerCase()}`
    : `${baseUrl}:${port}/api/${ENV_CONFIG.API.VERSION}`;
  
  return endpoint ? `${apiUrl}/${endpoint}` : apiUrl;
};

// 构建WebSocket URL
export const buildWebSocketUrl = (service) => {
  const baseUrl = getApiBaseUrl();
  const port = ENV_CONFIG.API.PORTS[service];
  
  if (!port) {
    throw new Error(`Unknown service: ${service}`);
  }
  
  const wsProtocol = baseUrl.startsWith('https://') ? 'wss://' : 'ws://';
  const wsBaseUrl = baseUrl.replace(/^https?:\/\//, '');
  
  return ENV_CONFIG.NODE_ENV === 'production'
    ? `${wsProtocol}${wsBaseUrl}/ws/${service.toLowerCase()}`
    : `${wsProtocol}${wsBaseUrl}:${port}/ws/${service.toLowerCase()}`;
};

// 调试日志函数
export const debugLog = (message, ...args) => {
  if (ENV_CONFIG.DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

// 验证文件类型
export const isValidFileType = (fileType) => {
  return ENV_CONFIG.FILE_UPLOAD.ALLOWED_TYPES.includes(fileType);
};

// 验证文件大小
export const isValidFileSize = (fileSize) => {
  return fileSize <= ENV_CONFIG.FILE_UPLOAD.MAX_SIZE;
};

// 检查功能是否启用
export const isFeatureEnabled = (feature) => {
  return ENV_CONFIG.FEATURES[feature] === true;
};

export default ENV_CONFIG;