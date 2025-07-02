// simple-server.js - 大学作业用的超简单服务器
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 基础配置
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Chat APP 后端服务器运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'chat-app-backend',
    users_count: users.length,
    online_users: onlineUsers.size,
    messages_count: messages.length
  });
});

// 内存数据存储（演示用）
let users = [
  { id: 1, email: 'alice@test.com', username: 'Alice', password: '123456' },
  { id: 2, email: 'bob@test.com', username: 'Bob', password: '123456' }
];
let messages = [];
let onlineUsers = new Set();

// ====================== 认证API ======================
// 登录接口
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('登录请求:', { email, password });
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    onlineUsers.add(user.id);
    res.json({ 
      success: true,
      token: `fake-token-${user.id}`, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.username,  // 添加 name 字段
        username: user.username 
      }
    });
  } else {
    res.status(401).json({ 
      success: false,
      error: '邮箱或密码错误',
      message: '邮箱或密码错误'
    });
  }
});

// 注册接口
app.post('/api/v1/auth/register', (req, res) => {
  const { email, name, password, verificationCode } = req.body;
  console.log('注册请求:', { email, name, password, verificationCode });

  // 验证必填字段
  if (!email || !name || !password || !verificationCode) {
    return res.status(400).json({ 
      success: false,
      error: '所有字段都是必填的' 
    });
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      error: '邮箱格式不正确' 
    });
  }

  // 验证密码长度
  if (password.length < 6) {
    return res.status(400).json({ 
      success: false,
      error: '密码长度至少6位' 
    });
  }

  // 检查邮箱是否已存在
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ 
      success: false,
      error: '该邮箱已被注册',
      code: 'USER_EXISTS'
    });
  }

  // 验证验证码
  const storedCodeData = verificationCodes.get(email);
  
  if (!storedCodeData) {
    return res.status(400).json({ 
      success: false,
      error: '验证码已过期或不存在，请重新获取',
      code: 'VCODE_EXPIRED'
    });
  }

  // 检查验证码是否过期（5分钟）
  const now = Date.now();
  if (now - storedCodeData.timestamp > 5 * 60 * 1000) {
    verificationCodes.delete(email);
    return res.status(400).json({ 
      success: false,
      error: '验证码已过期，请重新获取',
      code: 'VCODE_EXPIRED'
    });
  }

  // 验证验证码
  if (storedCodeData.code !== verificationCode) {
    return res.status(400).json({ 
      success: false,
      error: '验证码错误',
      code: 'VCODE_ERROR'
    });
  }

  // 验证码正确，创建新用户
  const newUser = {
    id: users.length + 1,
    email,
    username: name,
    password
  };
  
  users.push(newUser);
  
  // 删除已使用的验证码
  verificationCodes.delete(email);
  
  res.json({ 
    success: true,
    user: { 
      id: newUser.id, 
      email, 
      name: name,
      username: name 
    },
    message: '注册成功'
  });
});

// 获取用户信息
app.get('/api/v1/users/profile', (req, res) => {
  // 简单从token解析用户ID
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = token ? parseInt(token.split('-').pop()) : null;
  
  const user = users.find(u => u.id === userId);
  if (user) {
    res.json({ user: { id: user.id, email: user.email, username: user.username } });
  } else {
    res.status(401).json({ error: '未授权' });
  }
});

// 获取所有用户列表
app.get('/api/v1/users', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = token ? parseInt(token.split('-').pop()) : null;
  
  // 返回除自己外的所有用户
  const userList = users
    .filter(u => u.id !== userId)
    .map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      status: onlineUsers.has(u.id) ? 'online' : 'offline'
    }));
  
  res.json({ users: userList });
});

// 搜索用户
app.get('/api/v1/users/search', (req, res) => {
  const { q } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = token ? parseInt(token.split('-').pop()) : null;
  
  if (!q) {
    return res.json({ users: [] });
  }
  
  const searchResults = users
    .filter(u => u.id !== userId && 
      (u.username.toLowerCase().includes(q.toLowerCase()) || 
       u.email.toLowerCase().includes(q.toLowerCase())))
    .map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      status: onlineUsers.has(u.id) ? 'online' : 'offline'
    }));
  
  res.json({ users: searchResults });
});

// ====================== 聊天API ======================
// 获取消息历史
app.get('/api/v1/chat/messages', (req, res) => {
  const { contact_id } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = token ? parseInt(token.split('-').pop()) : null;
  
  // 过滤出相关的聊天消息
  const chatMessages = messages.filter(msg => 
    (msg.sender_id === userId && msg.receiver_id === parseInt(contact_id)) ||
    (msg.sender_id === parseInt(contact_id) && msg.receiver_id === userId)
  );
  
  res.json({ messages: chatMessages });
});

// 发送消息
app.post('/api/v1/chat/messages', (req, res) => {
  const { receiver_id, content, type = 'text' } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const sender_id = token ? parseInt(token.split('-').pop()) : null;
  
  const message = {
    id: Date.now(),
    sender_id,
    receiver_id: parseInt(receiver_id),
    content,
    type,
    timestamp: new Date().toISOString()
  };
  
  messages.push(message);
  
  // 通过WebSocket实时发送
  io.emit('new_message', message);
  
  res.json({ message });
});

// ====================== 好友API ======================
// 获取好友列表
app.get('/api/v1/friends', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = token ? parseInt(token.split('-').pop()) : null;
  
  // 简单返回除自己外的所有用户作为好友
  const friends = users
    .filter(u => u.id !== userId)
    .map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      status: onlineUsers.has(u.id) ? 'online' : 'offline'
    }));
  
  res.json({ friends });
});

// ====================== 视频通话API ======================
// 创建视频会话
app.post('/api/v1/video/sessions', (req, res) => {
  const { participant_id } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const initiator_id = token ? parseInt(token.split('-').pop()) : null;
  
  const session = {
    id: `session_${Date.now()}`,
    initiator_id,
    participant_id: parseInt(participant_id),
    status: 'calling',
    created_at: new Date().toISOString()
  };
  
  // 通知被叫方
  io.emit('incoming_call', {
    session_id: session.id,
    caller_id: initiator_id,
    caller_name: users.find(u => u.id === initiator_id)?.username
  });
  
  res.json({ session });
});

// 更新会话状态
app.put('/api/v1/video/sessions/:sessionId/status', (req, res) => {
  const { status } = req.body;
  const sessionId = req.params.sessionId;
  
  // 通知相关用户
  io.emit('call_status_changed', {
    session_id: sessionId,
    status: status
  });
  
  res.json({ 
    session: { 
      id: sessionId, 
      status, 
      updated_at: new Date().toISOString() 
    } 
  });
});

// ====================== WebSocket处理 ======================
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户加入
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    socket.userId = userId;
    onlineUsers.add(parseInt(userId));
    console.log(`用户 ${userId} 加入房间`);
    
    // 广播用户上线状态
    socket.broadcast.emit('friend_status_change', {
      userId: parseInt(userId),
      status: 'online'
    });
  });

  // 实时发送消息
  socket.on('send_message', (data) => {
    console.log('收到实时消息:', data);
    
    const message = {
      id: Date.now(),
      sender_id: data.sender_id,
      receiver_id: data.receiver_id,
      content: data.content,
      type: data.type || 'text',
      timestamp: new Date().toISOString()
    };
    
    messages.push(message);
    
    // 发送给目标用户
    socket.to(`user_${data.receiver_id}`).emit('new_message', message);
    
    // 也发送给自己确认
    socket.emit('message_sent', message);
  });

  // 视频通话相关
  socket.on('call_initiated', (data) => {
    socket.to(`user_${data.participant_id}`).emit('call_initiated', data);
  });

  socket.on('call_accepted', (data) => {
    socket.to(`user_${data.caller_id}`).emit('call_accepted', data);
  });

  socket.on('call_rejected', (data) => {
    socket.to(`user_${data.caller_id}`).emit('call_rejected', data);
  });

  socket.on('video_frame', (data) => {
    socket.to(`user_${data.target_user_id}`).emit('video_frame', data);
  });

  // 断开连接
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(parseInt(socket.userId));
      
      // 广播用户下线状态
      socket.broadcast.emit('friend_status_change', {
        userId: parseInt(socket.userId),
        status: 'offline'
      });
    }
    console.log('用户断开连接:', socket.id);
  });
});

// ====================== 启动服务器 ======================
const PORT = 3001;

server.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log('📋 测试账号:');
  console.log('   alice@test.com / 123456');
  console.log('   bob@test.com / 123456');
  console.log('');
  console.log('🔗 API端点:');
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/send-code`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/login-with-code`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/friends`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/chat/messages`);
  console.log(`   POST http://localhost:${PORT}/api/v1/chat/messages`);
  console.log('');
  console.log('🧪 使用前端应用测试:');
  console.log('   npm run dev  # 启动前端开发服务器');
  console.log('   然后访问注册页面测试验证码功能');
  console.log('');
  console.log('💡 验证码功能说明:');
  console.log('   - 验证码有效期: 5分钟');
  console.log('   - 最大尝试次数: 30次');
  console.log('   - 真实邮件发送: 通过Python脚本');
  console.log('   - 验证码格式: 6位字符（数字+大写字母）');
  console.log('');
  console.log('📧 邮件发送测试:');
  console.log('   python test_email.py  # 测试邮件发送功能');
  console.log('   python send_email.py <email> <code>  # 手动发送测试');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 服务器关闭中...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

// 内存存储验证码（生产环境应使用Redis等）
let verificationCodes = new Map();

// 发送验证码接口
app.post('/api/v1/auth/send-code', async (req, res) => {
  const { email } = req.body;
  console.log('发送验证码请求:', { email });

  if (!email) {
    return res.status(400).json({ 
      success: false,
      error: '邮箱不能为空' 
    });
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      error: '邮箱格式不正确' 
    });
  }

  // 生成6位验证码（与Python后端格式一致）
  const code = Array.from({length: 6}, () => 
    '23456789QWERTYUPASDFGHJKZXCVBNM98765432'[Math.floor(Math.random() * 38)]
  ).join('');
  
  // 存储验证码（5分钟有效期）
  verificationCodes.set(email, {
    code: code,
    timestamp: Date.now(),
    attempts: 0
  });

  // 设置5分钟后自动删除验证码
  setTimeout(() => {
    verificationCodes.delete(email);
  }, 5 * 60 * 1000);

  console.log(`为 ${email} 生成验证码: ${code}`);

  // 调用Python脚本发送真实邮件
  try {
    const pythonProcess = spawn('python', ['send_email.py', email, code], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code_exit) => {
      if (code_exit === 0) {
        try {
          const result = JSON.parse(output.trim());
          if (result.success) {
            console.log(`✅ 验证码邮件发送成功: ${email}`);
            res.json({ 
              success: true,
              message: '验证码已发送到您的邮箱',
              // 开发环境下返回验证码便于测试
              dev_code: code
            });
          } else {
            console.error(`❌ Python脚本返回错误: ${result.error}`);
            res.status(500).json({ 
              success: false,
              error: result.error || '邮件发送失败' 
            });
          }
        } catch (parseError) {
          console.error(`❌ 解析Python输出失败: ${parseError.message}`);
          console.error(`Python输出: ${output}`);
          res.status(500).json({ 
            success: false,
            error: '邮件服务响应格式错误' 
          });
        }
      } else {
        console.error(`❌ Python脚本执行失败，退出码: ${code_exit}`);
        console.error(`错误输出: ${errorOutput}`);
        res.status(500).json({ 
          success: false,
          error: '邮件发送服务不可用' 
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`❌ 启动Python脚本失败: ${error.message}`);
      res.status(500).json({ 
        success: false,
        error: '邮件发送服务启动失败，请确保已安装Python' 
      });
    });

  } catch (error) {
    console.error(`❌ 调用邮件发送服务失败: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: '邮件发送服务异常' 
    });
  }
});

// 验证码登录接口
app.post('/api/v1/auth/login-with-code', (req, res) => {
  const { email, code } = req.body;
  console.log('验证码登录请求:', { email, code });

  if (!email || !code) {
    return res.status(400).json({ 
      success: false,
      error: '邮箱和验证码不能为空' 
    });
  }

  const storedCodeData = verificationCodes.get(email);
  
  if (!storedCodeData) {
    return res.status(400).json({ 
      success: false,
      error: '验证码已过期或不存在，请重新获取' 
    });
  }

  // 检查验证码是否过期（5分钟）
  const now = Date.now();
  if (now - storedCodeData.timestamp > 5 * 60 * 1000) {
    verificationCodes.delete(email);
    return res.status(400).json({ 
      success: false,
      error: '验证码已过期，请重新获取' 
    });
  }

  // 检查尝试次数（最多30次）
  if (storedCodeData.attempts >= 30) {
    verificationCodes.delete(email);
    return res.status(400).json({ 
      success: false,
      error: '验证码尝试次数过多，请重新获取' 
    });
  }

  // 验证验证码
  if (storedCodeData.code !== code) {
    storedCodeData.attempts++;
    return res.status(400).json({ 
      success: false,
      error: '验证码错误' 
    });
  }

  // 验证码正确，查找用户
  const user = users.find(u => u.email === email);
  
  if (!user) {
    verificationCodes.delete(email);
    return res.status(400).json({ 
      success: false,
      error: '用户不存在，请先注册' 
    });
  }

  // 登录成功
  verificationCodes.delete(email);
  onlineUsers.add(user.id);
  
  res.json({ 
    success: true,
    token: `fake-token-${user.id}`, 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.username,
      username: user.username 
    }
  });
});