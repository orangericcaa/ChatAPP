# pyright: reportInvalidTypeForm=false
import os
import time
import random
import hashlib
import threading
import smtplib
import uuid
from email.mime.text import MIMEText
from email.header import Header

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from pydantic import BaseModel, EmailStr, constr

from dotenv import load_dotenv

import jwt
from datetime import datetime, timedelta

# 自动判断运行环境并设置路径
def get_paths():
    current_dir = os.path.dirname(__file__)
    
    # 判断是否在容器内运行（容器内通常有这些特征）
    is_container = os.path.exists('/app') and os.path.exists('/common')
    
    if is_container:
        # 容器内路径
        return {
            'env_path': '/common/.env',
            'db_path': '/db/server.db',
            'common_path': '/common'
        }
    else:
        # 本地开发路径
        return {
            'env_path': os.path.join(current_dir, '..', 'common', '.env'),
            'db_path': os.path.join(current_dir, '..', 'db', 'server.db'),
            'common_path': os.path.join(current_dir, '..', 'common')
        }

paths = get_paths()

# 加载.env配置
load_dotenv(dotenv_path=paths['env_path'])

SECRET_KEY = os.getenv("SECRET_KEY", "thisisaverysecretkey12345678")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.qq.com")
VERICODE = int(os.getenv("VERICODE", 600))
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 60 * 24 * 7))  # 默认7天

# 数据库路径
DB_PATH = paths['db_path']

# 导入数据库相关函数
import sys
sys.path.append(paths['common_path'])
import database

database.init(DB_PATH)

# FastAPI 实例
app = FastAPI()

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- 统一返回结构与异常处理 -------------------

def api_response(success=True, data=None, message=""):
    return {"success": success, "data": data, "message": message}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "data": None, "message": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "data": None, "message": str(exc)},
    )

# 验证码存储（开发用内存，生产建议用Redis）
vericode_dict = {}
vericode_dict_lock = threading.Lock()

# 用户会话存储（简单的多端登录检测，生产环境建议用Redis）
user_sessions = {}
user_sessions_lock = threading.Lock()

# ------------------- Pydantic 数据模型 -------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    vericode: constr(pattern=r'^[A-Z0-9]{6}$')  # 6位大写字母或数字

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CodeLoginRequest(BaseModel):
    email: EmailStr
    code: constr(pattern=r'^[A-Z0-9]{6}$')  # 6位大写字母或数字

class CodeRequest(BaseModel):
    email: EmailStr

class TerminateSessionRequest(BaseModel):
    email: EmailStr
    current_session_token: str

# ------------------- JWT 相关函数 -------------------

def create_jwt_token(email: str, username: str = "", expire_minutes: int = JWT_EXPIRE_MINUTES):
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    payload = {
        "sub": email,
        "username": username,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

def generate_session_token():
    """生成唯一的会话token"""
    return str(uuid.uuid4())

def check_multi_login(email: str):
    """检查用户是否有多端登录"""
    with user_sessions_lock:
        return email in user_sessions and len(user_sessions[email]) > 0

def add_user_session(email: str, session_token: str):
    """添加用户会话"""
    with user_sessions_lock:
        if email not in user_sessions:
            user_sessions[email] = []
        user_sessions[email].append({
            'session_token': session_token,
            'login_time': datetime.utcnow(),
            'device_info': 'web'  # 可以扩展为更详细的设备信息
        })

def remove_user_sessions(email: str, keep_session_token: str = None):
    """移除用户的其他会话"""
    with user_sessions_lock:
        if email in user_sessions:
            if keep_session_token:
                # 只保留当前会话
                user_sessions[email] = [
                    session for session in user_sessions[email] 
                    if session['session_token'] == keep_session_token
                ]
            else:
                # 移除所有会话
                del user_sessions[email]

# ------------------- 邮件发送函数 -------------------

def send_email(email: str, vericode: str) -> bool:
    mail_html = f"""您的验证码为：<b>{vericode}</b>，10分钟内有效。"""
    message = MIMEText(mail_html, 'html', 'utf-8')
    message['From'] = EMAIL_USER
    message['To'] = email
    message['Subject'] = Header("验证码", 'utf-8')
    try:
        server = smtplib.SMTP_SSL(SMTP_SERVER)
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, [email], message.as_string())
        server.quit()
        return True
    except Exception as e:
        print("邮件发送失败:", e)
        return False

# ------------------- API 路由 -------------------

@app.post("/api/v1/auth/send-code")
def send_code(data: CodeRequest):
    vericode = ''.join(random.choice('23456789QWERTYUPASDFGHJKZXCVBNM98765432') for _ in range(6))
    if not send_email(data.email, vericode):
        raise HTTPException(status_code=500, detail="验证码发送失败")
    with vericode_dict_lock:
        vericode_dict[data.email] = (vericode, time.time())
    return api_response(True, None, "验证码已发送")

@app.post("/api/v1/auth/register")
def register(data: RegisterRequest):
    with vericode_dict_lock:
        code_info = vericode_dict.get(data.email)
        if not code_info or code_info[0] != data.vericode or time.time() - code_info[1] > VERICODE:
            raise HTTPException(status_code=400, detail="验证码无效或已过期")
    
    if database.find_user(DB_PATH, data.email):
        raise HTTPException(status_code=400, detail="邮箱已注册")
    
    pwdhash = hashlib.sha256(data.password.encode('utf-8')).hexdigest()
    database.register_user(DB_PATH, data.email, data.username, pwdhash)
    
    # 注册成功后直接生成token和会话
    token = create_jwt_token(data.email, data.username)
    session_token = generate_session_token()
    add_user_session(data.email, session_token)
    
    # 修复：返回完整用户信息结构
    return api_response(True, {
        "token": token,
        "user": {
            "email": data.email,
            "name": data.username,
            "username": data.username  # 兼容前端的两种字段名
        },
        "session_token": session_token,
        "multi_login_detected": False  # 新注册用户不会有多端登录
    }, "注册成功")

@app.post("/api/v1/auth/login")
def login(data: LoginRequest):
    pwdhash = database.get_pwdhash(DB_PATH, data.email)
    if not pwdhash or pwdhash != hashlib.sha256(data.password.encode('utf-8')).hexdigest():
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    
    username = database.get_username(DB_PATH, data.email) or ""
    
    # 检查多端登录
    multi_login_detected = check_multi_login(data.email)
    
    # 生成新的会话
    token = create_jwt_token(data.email, username)
    session_token = generate_session_token()
    
    # 修复：返回完整用户信息结构
    response_data = {
        "token": token,
        "user": {
            "email": data.email,
            "name": username,
            "username": username  # 兼容前端的两种字段名
        },
        "session_token": session_token,
        "multi_login_detected": multi_login_detected
    }
    
    add_user_session(data.email, session_token)
    
    return api_response(True, response_data, "登录成功")

@app.post("/api/v1/auth/login-with-code")
def login_with_code(data: CodeLoginRequest):
    with vericode_dict_lock:
        code_info = vericode_dict.get(data.email)
        if not code_info or code_info[0] != data.code or time.time() - code_info[1] > VERICODE:
            raise HTTPException(status_code=400, detail="验证码无效或已过期")
    
    if not database.find_user(DB_PATH, data.email):
        raise HTTPException(status_code=401, detail="用户不存在")
    
    username = database.get_username(DB_PATH, data.email) or ""
    
    # 检查多端登录
    multi_login_detected = check_multi_login(data.email)
    
    # 生成新的会话
    token = create_jwt_token(data.email, username)
    session_token = generate_session_token()
    
    # 修复：返回完整用户信息结构
    response_data = {
        "token": token,
        "user": {
            "email": data.email,
            "name": username,
            "username": username  # 兼容前端的两种字段名
        },
        "session_token": session_token,
        "multi_login_detected": multi_login_detected
    }
    
    add_user_session(data.email, session_token)
    
    return api_response(True, response_data, "登录成功")

# 新增：终止其他会话的接口
@app.post("/api/v1/auth/terminate-other-sessions")
def terminate_other_sessions(data: TerminateSessionRequest):
    """终止用户的其他登录会话，只保留当前会话"""
    try:
        remove_user_sessions(data.email, data.current_session_token)
        # 如果当前会话token不为空，需要重新添加当前会话
        if data.current_session_token:
            add_user_session(data.email, data.current_session_token)
        return api_response(True, None, "已终止其他设备的登录")
    except Exception as e:
        raise HTTPException(status_code=500, detail="终止其他会话失败")

# 新增：获取用户会话列表（可选）
@app.get("/api/v1/auth/sessions")
def get_user_sessions(email: str):
    """获取用户的所有活跃会话"""
    with user_sessions_lock:
        sessions = user_sessions.get(email, [])
        return api_response(True, {
            "sessions": [
                {
                    "session_token": session["session_token"][:8] + "...",  # 只显示部分token
                    "login_time": session["login_time"].isoformat(),
                    "device_info": session["device_info"]
                }
                for session in sessions
            ]
        }, "获取会话列表成功")

# 可选：token校验、刷新等接口
@app.post("/api/v1/auth/verify")
def verify_token():
    # 这里可以实现JWT等token校验逻辑
    return api_response(True, None, "token有效")

@app.post("/api/v1/auth/refresh")
def refresh_token():
    # 这里可以实现token刷新逻辑
    return api_response(True, None, "token已刷新")

@app.post("/api/v1/auth/logout")
def logout():
    # 这里可以实现登出逻辑（如清除用户会话等）
    return api_response(True, None, "已登出")

# 新增：健康检查接口
@app.get("/api/v1/auth/health")
def health_check():
    return api_response(True, {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}, "服务正常")

if __name__ == "__main__":
    print(f"数据库路径: {DB_PATH}")
    print(f"环境变量路径: {paths['env_path']}")
    print(f"邮箱配置: {EMAIL_USER}")
    print("认证服务启动中...")

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)