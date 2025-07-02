// simple-server.js - 大学作业用的超简单服务器
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

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
      token: `fake-token-${user.id}`, 
      user: { id: user.id, email: user.email, username: user.username }
    });
  } else {
    res.status(401).json({ error: '邮箱或密码错误' });
  }
});

// 注册接口
app.post('/api/v1/auth/register', (req, res) => {
  const { email, name, password } = req.body;
  console.log('注册请求:', { email, name, password });
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: '邮箱已存在' });
  }
  
  const newUser = {
    id: users.length + 1,
    email,
    username: name,
    password
  };
  
  users.push(newUser);
  res.json({ user: { id: newUser.id, email, username: name } });
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
  console.log(`   GET  http://localhost:${PORT}/api/v1/friends`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/chat/messages`);
  console.log(`   POST http://localhost:${PORT}/api/v1/chat/messages`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 服务器关闭中...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});