# pyright: reportInvalidTypeForm=false
import os
import time
import random
import hashlib
import threading
import smtplib
from email.mime.text import MIMEText
from email.header import Header

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from pydantic import BaseModel, EmailStr, constr

from dotenv import load_dotenv

import jwt  # 新增
from datetime import datetime, timedelta  # 新增

# 加载.env配置
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

SECRET_KEY = os.getenv("SECRET_KEY", "thisisaverysecretkey12345678")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.qq.com")
VERICODE = int(os.getenv("VERICODE", 600))
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 60 * 24 * 7))  # 默认7天

# 数据库路径（可根据实际情况调整）
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db", "server.db"))

# 导入数据库相关函数（假设你把数据库相关函数放在 server/Database.py）
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import database as database

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
    # 注册成功后直接生成token返回
    token = create_jwt_token(data.email, data.username)
    return api_response(True, {"token": token}, "注册成功")

@app.post("/api/v1/auth/login")
def login(data: LoginRequest):
    pwdhash = database.get_pwdhash(DB_PATH, data.email)
    if not pwdhash or pwdhash != hashlib.sha256(data.password.encode('utf-8')).hexdigest():
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    # 登录成功生成token
    username = database.get_username(DB_PATH, data.email) or ""
    token = create_jwt_token(data.email, username)
    return api_response(True, {"token": token}, "登录成功")

@app.post("/api/v1/auth/login-with-code")
def login_with_code(data: CodeLoginRequest):
    with vericode_dict_lock:
        code_info = vericode_dict.get(data.email)
        if not code_info or code_info[0] != data.code or time.time() - code_info[1] > VERICODE:
            raise HTTPException(status_code=400, detail="验证码无效或已过期")
    if not database.find_user(DB_PATH, data.email):
        raise HTTPException(status_code=401, detail="用户不存在")
    username = database.get_username(DB_PATH, data.email) or ""
    token = create_jwt_token(data.email, username)
    return api_response(True, {"token": token}, "登录成功")

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
    # 这里可以实现登出逻辑（如黑名单token等）
    return api_response(True, None, "已登出")