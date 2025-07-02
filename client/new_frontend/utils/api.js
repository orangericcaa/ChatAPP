/**
 * API调用工具函数
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiClient {
  /**
   * 获取所有用户（用于全平台搜索）
   * @returns {Promise<Array>} 用户列表
   */
  async getAllUsers() {
    return this.request('/users');
  }

  /**
   * 搜索用户（根据关键词）
   * @param {string} keyword - 搜索关键词（昵称、邮箱等）
   * @returns {Promise<Array>} 匹配的用户列表
   */
  async searchUsers(keyword) {
    return this.request(`/users/search?keyword=${encodeURIComponent(keyword)}`);
  }

  /**
   * 获取待处理的好友请求列表（如别人加我）
   * @returns {Promise<Array>} 好友请求列表
   */
  async getFriendRequests() {
    return this.request('/friends/requests');
  }

  /**
   * 同意好友请求
   * @param {string} requestId - 好友请求ID
   * @returns {Promise<Object>} 操作结果
   */
  async acceptFriendRequest(requestId) {
    return this.request(`/friends/requests/${requestId}/accept`, {
      method: 'POST',
    });
  }

  /**
   * 拒绝好友请求
   * @param {string} requestId - 好友请求ID
   * @returns {Promise<Object>} 操作结果
   */
  async rejectFriendRequest(requestId) {
    return this.request(`/friends/requests/${requestId}/reject`, {
      method: 'POST',
    });
  }
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      console.log('API请求:', { url, config }); // 添加调试日志
      const response = await fetch(url, config);
      
      console.log('API响应状态:', response.status); // 添加调试日志
      
      // 检查响应是否为JSON格式
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`服务器返回非JSON格式数据，状态码: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API响应数据:', data); // 添加调试日志

      // 对于401错误，也返回数据而不是抛出异常，让调用方处理
      if (!response.ok && response.status !== 401) {
        throw new Error(data.error || data.message || `请求失败，状态码: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      
      // 区分不同类型的错误
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查后端服务器是否启动');
      } else if (error.name === 'SyntaxError') {
        throw new Error('服务器返回数据格式错误');
      } else {
        throw error;
      }
    }
  }

  // ===================== 认证相关 =====================

  /**
   * 用户登录
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
   * @returns {Promise<Object>} 登录结果，包含token和用户信息
   */
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * 用户注册
   * @param {string} email - 用户邮箱
   * @param {string} name - 用户昵称
   * @param {string} password - 用户密码
   * @param {string} verificationCode - 邮箱验证码
   * @returns {Promise<Object>} 注册结果
   */
  async register(email, name, password, verificationCode) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password, verificationCode }),
    });
  }

  /**
   * 发送邮箱验证码
   * @param {string} email - 用户邮箱
   * @returns {Promise<Object>} 发送结果
   */
  async sendVerificationCode(email) {
    return this.request('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * 邮箱验证码登录
   * @param {string} email - 用户邮箱
   * @param {string} code - 邮箱验证码
   * @returns {Promise<Object>} 登录结果，包含token和用户信息
   */
  async loginWithCode(email, code) {
    return this.request('/auth/login-with-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  /**
   * 用户登出
   * @returns {Promise<Object>} 登出结果
   */
  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // ===================== 用户相关 =====================

  /**
   * 获取当前登录用户的个人信息
   * @returns {Promise<Object>} 用户信息（如昵称、邮箱、头像等）
   */
  async getProfile() {
    return this.request('/users/profile');
  }

  /**
   * 更新当前登录用户的个人信息
   * @param {Object} data - 要更新的用户信息（如昵称、头像等）
   * @returns {Promise<Object>} 更新结果
   */
  async updateProfile(data) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ===================== 好友相关 =====================

  /**
   * 获取当前用户的好友列表
   * @returns {Promise<Array>} 好友列表
   */
  async getFriends() {
    return this.request('/friends');
  }

  /**
   * 添加好友
   * @param {string} friendId - 好友用户ID
   * @returns {Promise<Object>} 添加结果
   */
  async addFriend(friendId) {
    return this.request(`/friends/${friendId}`, {
      method: 'POST',
    });
  }

  /**
   * 删除好友
   * @param {string} friendId - 好友用户ID
   * @returns {Promise<Object>} 删除结果
   */
  async removeFriend(friendId) {
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE',
    });
  }

  // ===================== 聊天相关 =====================

  /**
   * 获取与指定联系人的聊天消息
   * @param {string} contactId - 联系人用户ID
   * @returns {Promise<Array>} 聊天消息列表
   */
  async getChatMessages(contactId) {
    return this.request(`/chat/messages?contact_id=${contactId}`);
  }

  /**
   * 发送聊天消息
   * @param {string} receiverId - 接收方用户ID
   * @param {string} content - 消息内容
   * @param {string} [type='text'] - 消息类型（如text、image等）
   * @returns {Promise<Object>} 发送结果
   */
  async sendMessage(receiverId, content, type = 'text') {
    return this.request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, content, type }),
    });
  }

  // ===================== 视频通话相关 =====================

  /**
   * 创建视频通话会话
   * @param {string} participantId - 对方用户ID
   * @returns {Promise<Object>} 会话创建结果，包含会话ID等信息
   */
  async createVideoSession(participantId) {
    return this.request('/video/sessions', {
      method: 'POST',
      body: JSON.stringify({ participant_id: participantId }),
    });
  }

  /**
   * 获取视频通话会话详情
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Object>} 会话详情
   */
  async getVideoSession(sessionId) {
    return this.request(`/video/sessions/${sessionId}`);
  }

  /**
   * 更新视频通话会话状态（如接听、挂断等）
   * @param {string} sessionId - 会话ID
   * @param {string} status - 新的会话状态
   * @returns {Promise<Object>} 更新结果
   */
  async updateVideoSessionStatus(sessionId, status) {
    return this.request(`/video/sessions/${sessionId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

export default new ApiClient();