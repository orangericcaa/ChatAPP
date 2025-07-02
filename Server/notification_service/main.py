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

# 导入数据库相关函数（如有需要）
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

# ------------------- 数据模型 -------------------

class Notification(BaseModel):
    user: EmailStr
    content: str
    type: str = "info"
    timestamp: float = time.time()

class MarkReadRequest(BaseModel):
    user: EmailStr
    notification_id: int

class NotificationSettingsRequest(BaseModel):
    user: EmailStr
    enable: bool

# ------------------- WebSocket连接管理 -------------------

active_connections = {}
active_connections_lock = threading.Lock()

@app.websocket("/ws/notification")
async def notification_websocket(websocket: WebSocket):
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
            # 这里可以根据data内容处理通知，如推送、已读等
            # 示例：收到"ping"回复"pong"
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
    except WebSocketDisconnect:
        if user_id:
            with active_connections_lock:
                if user_id in active_connections:
                    del active_connections[user_id]

# ------------------- HTTP API 路由 -------------------

@app.get("/api/v1/notifications")
def get_notifications(user: EmailStr = Query(...)):
    # 从数据库获取通知列表
    notifications = database.get_notifications(DB_PATH, user)
    return api_response(True, {"notifications": notifications}, "获取通知成功")

@app.post("/api/v1/mark-read")
def mark_read(data: MarkReadRequest):
    # 标记通知为已读
    database.mark_notification_read(DB_PATH, data.user, data.notification_id)
    return api_response(True, None, "通知已标记为已读")

@app.post("/api/v1/settings")
def update_settings(data: NotificationSettingsRequest):
    # 更新通知设置
    database.update_notification_settings(DB_PATH, data.user, data.enable)
    return api_response(True, None, "通知设置已更新")