// config/httpClient.js
// HTTP请求客户端封装

import API_CONFIG from './api.js';

// 请求拦截器 - 添加认证token等
const requestInterceptor = (config) => {
  // 从localStorage获取token（如果有的话）
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  
  // 设置默认的Content-Type
  config.headers = {
    'Content-Type': 'application/json',
    ...config.headers,
  };
  
  return config;
};

// 响应拦截器 - 处理通用错误
const responseInterceptor = (response) => {
  // 检查响应状态
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  } else {
    throw new Error(`HTTP Error: ${response.status}`);
  }
};

// 错误处理器
const errorHandler = (error) => {
  console.error('API Request Error:', error);
  
  // 处理网络错误
  if (!error.response) {
    throw new Error('网络连接失败，请检查网络设置');
  }
  
  // 处理HTTP状态码错误
  switch (error.response.status) {
    case 401:
      // 未授权，清除token并跳转到登录页
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('登录已过期，请重新登录');
    
    case 403:
      throw new Error('没有权限访问此资源');
    
    case 404:
      throw new Error('请求的资源不存在');
    
    case 500:
      throw new Error('服务器内部错误');
    
    default:
      throw new Error(error.response.data?.message || '请求失败');
  }
};

// 基础HTTP请求函数
const request = async (url, options = {}) => {
  const config = {
    method: 'GET',
    timeout: API_CONFIG.TIMEOUT,
    ...options,
  };
  
  try {
    // 应用请求拦截器
    const interceptedConfig = requestInterceptor(config);
    
    // 发送请求
    const response = await fetch(url, {
      method: interceptedConfig.method,
      headers: interceptedConfig.headers,
      body: interceptedConfig.body,
      signal: AbortSignal.timeout(interceptedConfig.timeout),
    });
    
    // 应用响应拦截器
    return await responseInterceptor(response);
    
  } catch (error) {
    return errorHandler(error);
  }
};

// HTTP方法封装
export const httpClient = {
  // GET请求
  get: (url, params = {}) => {
    const urlWithParams = new URL(url);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        urlWithParams.searchParams.append(key, params[key]);
      }
    });
    
    return request(urlWithParams.toString());
  },

  // POST请求
  post: (url, data = {}) => {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT请求
  put: (url, data = {}) => {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE请求
  delete: (url) => {
    return request(url, {
      method: 'DELETE',
    });
  },

  // 文件上传
  upload: (url, formData) => {
    return request(url, {
      method: 'POST',
      headers: {
        // 不设置Content-Type，让浏览器自动设置multipart/form-data
      },
      body: formData,
    });
  },

  // 下载文件
  download: async (url, filename) => {
    try {
      const response = await fetch(url, {
        headers: requestInterceptor({}).headers,
      });
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('下载文件失败:', error);
      throw error;
    }
  },
};

export default httpClient;