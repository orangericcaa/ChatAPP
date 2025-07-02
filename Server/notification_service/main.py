import os
import sys
import time
import threading
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

# 加载.env配置
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# 数据库路径（如有需要可用数据库持久化通知）
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db", "server.db"))

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

# ------------------- 数据模型 -------------------

class Notification(BaseModel):
    id: int
    user: EmailStr
    content: str
    timestamp: float
    read: bool = False

class MarkReadRequest(BaseModel):
    user: EmailStr
    notification_id: int

class NotificationSettings(BaseModel):
    user: EmailStr
    enable_push: bool = True

# ------------------- 内存通知存储（可替换为数据库） -------------------

notifications = []
notifications_lock = threading.Lock()
notification_id_counter = 1

user_settings = {}
user_settings_lock = threading.Lock()

# ------------------- HTTP API 路由 -------------------

@app.get("/api/v1/notifications")
def get_notifications(user: EmailStr = Query(...)):
    with notifications_lock:
        user_notices = [n for n in notifications if n.user == user]
    return api_response(True, {"notifications": user_notices}, "获取通知列表成功")

@app.post("/api/v1/mark-read")
def mark_read(data: MarkReadRequest):
    with notifications_lock:
        for n in notifications:
            if n.id == data.notification_id and n.user == data.user:
                n.read = True
                break
    return api_response(True, None, "通知已标记为已读")

@app.get("/api/v1/settings")
def get_settings(user: EmailStr = Query(...)):
    with user_settings_lock:
        settings = user_settings.get(user, {"enable_push": True})
    return api_response(True, {"settings": settings}, "获取通知设置成功")

@app.post("/api/v1/settings")
def update_settings(data: NotificationSettings):
    with user_settings_lock:
        user_settings[data.user] = {"enable_push": data.enable_push}
    return api_response(True, None, "设置已更新")

# ------------------- WebSocket 实时通知 -------------------

active_connections = {}
active_connections_lock = threading.Lock()

@app.websocket("/ws/notification")
async def notification_ws(websocket: WebSocket):
    await websocket.accept()
    user_id = None
    try:
        # 首条消息应包含用户身份
        init_data = await websocket.receive_json()
        user_id = init_data.get("user_id")
        if not user_id:
            await websocket.close()
            return
        with active_connections_lock:
            active_connections[user_id] = websocket

        while True:
            data = await websocket.receive_json()
            # 支持客户端主动拉取通知
            if data.get("action") == "fetch":
                with notifications_lock:
                    user_notices = [n for n in notifications if n.user == user_id]
                await websocket.send_json({"type": "notifications", "notifications": user_notices})
    except WebSocketDisconnect:
        if user_id:
            with active_connections_lock:
                if user_id in active_connections:
                    del active_connections[user_id]

# ------------------- 通知推送工具函数 -------------------

def push_notification(user: str, content: str):
    global notification_id_counter
    with notifications_lock:
        n = Notification(
            id=notification_id_counter,
            user=user,
            content=content,
            timestamp=time.time(),
            read=False
        )
        notifications.append(n)
        notification_id_counter += 1
    # 实时推送
    with active_connections_lock:
        ws = active_connections.get(user)
    if ws:
        import asyncio
        asyncio.create_task(ws.send_json({"type": "notification", "notification": n.dict()}))