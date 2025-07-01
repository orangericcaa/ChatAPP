# 聊天应用程序

一个基于Python的实时聊天应用程序，支持用户注册、登录、好友系统和消息通信功能。

## 项目结构

### 🗂️ 核心目录
- **`.idea/`** - IDE配置文件（6%）
- **`ClientService/`** - 客户端服务模块（2,225%）
- **`imgs/`** - 图像资源文件夹（2,204%）
- **`ServerService/`** - 服务器端服务模块（7%）

### 📄 核心文件

#### 服务器端
- **`server.py`** (19%) - 主服务器程序
- **`ServerService/`** - 服务器端服务逻辑
- **`message.db`** (8%) - SQLite消息数据库
- **`server.db`** (28%) - 主数据库文件
- **`server - 副本.db`** (28%) - 数据库备份文件

#### 客户端UI页面
- **`page_login.py`** (7%) - 登录页面
- **`page_register.py`** (9%) - 注册页面
- **`page_finish_register.py`** (3%) - 注册完成页面
- **`page_finish_login.py`** (3%) - 登录完成页面
- **`page_error.py`** (2%) - 错误处理页面
- **`page_code_login.py`** (5%) - 验证码登录页面
- **`page_test_register.py`** (<1%) - 注册测试页面

#### 核心功能模块
- **`Communication.py`** (20%) - 通信模块
- **`control.py`** (13%) - 控制器模块
- **`main.py`** (9%) - 主聊天程序
- **`hkb.py`** (8%) - 用户管理模块
- **`windows_11.py`** (9%) - Windows 11界面适配
- **`windows_final.py`** (9%) - 最终界面版本

#### 配置和工具
- **`Const.py`** (<1%) - 常量定义
- **`Crush.py`** (<1%) - 崩溃处理
- **`page_login.spec`** (<1%) - 页面规格说明

#### 资源文件
- **`buptchat.png`** (5%) - 应用图标
- **`friend_request.png`** (2%) - 好友请求图标
- **`.gitignore`** (<1%) - Git忽略文件配置
- **`README.md`** (<1%) - 项目说明文档

## 功能特性

### 🔐 用户认证
- 用户注册和登录系统
- 验证码登录支持
- 用户会话管理

### 💬 聊天功能
- 实时消息发送和接收
- 消息持久化存储
- 聊天记录管理

### 👥 好友系统
- 好友请求发送和接收
- 好友列表管理
- 用户状态显示

### 🎨 用户界面
- 现代化GUI设计
- Windows 11风格适配
- 图标和图像支持
- 错误处理和用户反馈

## 技术栈

- **后端**: Python
- **数据库**: SQLite
- **GUI框架**: 可能使用Tkinter或PyQt
- **网络通信**: Socket编程
- **图像处理**: PNG图标支持

## 快速开始

### 环境要求
- Python 3.x
- SQLite3
- 相关GUI库依赖

### 安装步骤
1. 克隆项目到本地
2. 安装Python依赖包
3. 配置数据库连接
4. 启动服务器端程序
5. 运行客户端应用

### 运行方法
```bash
# 启动服务器
python server.py

# 启动客户端
python buptchat.py
```

## 数据库设计

项目使用SQLite数据库存储：
- 用户信息和认证数据
- 聊天消息记录
- 好友关系数据
- 系统配置信息

## 开发说明

### 主要模块
- **Communication.py**: 处理客户端-服务器通信协议
- **control.py**: 应用程序控制逻辑
- **hkb.py**: 用户和好友管理功能

### UI组件
- 多个页面模块实现不同功能界面
- 支持用户注册、登录、聊天等完整流程
- 错误处理和用户体验优化

## 贡献指南

1. Fork项目仓库
2. 创建功能分支
3. 提交代码更改
4. 发起Pull Request

## 许可证

请查看项目许可证文件了解使用条款。

---

*这是一个功能完整的Python聊天应用程序，适合学习网络编程、数据库操作和GUI开发的综合项目。*



ChatAPP/
├── 📁 .idea/                        (6%)
│   ├── 📁 inspectionProfiles/
│   ├── 📄 .gitignore
│   ├── 📄 .name
│   ├── 📄 LargeScaleProgramming.iml
│   ├── 📄 misc.xml
│   ├── 📄 modules.xml
│   ├── 📄 vcs.xml
│   └── 📄 workspace.xml
│
├── 📁 ClientService/                 (2,225%)
│   ├── 📁 __pycache__/
│   ├── 📁 imgs/
│   ├── 📄 __init__.py
│   ├── 📄 Communication.py
│   ├── 📄 Const.py
│   └── 📄 Model.py
│
├── 📁 imgs/                          (2,204%)
│   └── (图像文件...)
│
├── 📁 ServerService/                 (7%)
│   ├── 📁 __pycache__/
│   └── 📄 Database.py
│   └── 📄 Survival.py                    (未知%)
│
├── 📄 .gitignore                     (<1%)
├── 📄 Communication.py               (20%)
├── 📄 Const.py                       (<1%)
├── 📄 Crush.py                       (<1%)
├── 📄 README.md                      (<1%)
├── 📄 buptchat.png                   (5%)
├── 📄 buptchat.py                    (9%)
├── 📄 control.py                     (13%)
├── 📄 friend_request.png             (2%)
├── 📄 hkb.py                         (8%)
├── 📄 message.db                     (8%)
├── 📄 page_code_login.py             (5%)
├── 📄 page_error.py                  (2%)
├── 📄 page_finish_register.py        (3%)
├── 📄 page_finish_login.py           (3%)
├── 📄 page_login.py                  (7%)
├── 📄 page_login.spec                (<1%)
├── 📄 page_register.py               (9%)
├── 📄 page_test_register.py          (<1%)
├── 📄 server.db                      (28%)
├── 📄 server - 副本.db               (28%)
├── 📄 server.py                      (19%)
├── 📄 windows_11.py                  (9%)
└── 📄 windows_final.py               (9%)