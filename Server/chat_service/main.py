import os
import sys
import time
import threading
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

# 加载.env配置
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# 数据库路径
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db", "server.db"))

# 导入数据库相关函数
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

# ------------------- 聊天消息数据模型 -------------------

class ChatMessage(BaseModel):
    sender: EmailStr
    receiver: EmailStr
    content: str
    timestamp: float = None
    type: str = "text"

class DeleteMessageRequest(BaseModel):
    message_id: int

class MarkReadRequest(BaseModel):
    sender: EmailStr
    receiver: EmailStr

# ------------------- WebSocket连接管理 -------------------

active_connections = {}
active_connections_lock = threading.Lock()

# ------------------- HTTP API 路由 -------------------

@app.get("/api/v1/messages")
def get_messages(user1: EmailStr = Query(...), user2: EmailStr = Query(...), limit: int = 100):
    messages = database.get_messages(DB_PATH, user1, user2, limit)
    data = [
        {
            "sender": m[0],
            "receiver": m[1],
            "content": m[2],
            "timestamp": m[3],
            "type": m[4]
        } for m in messages
    ]
    return api_response(True, data, "获取消息成功")

@app.post("/api/v1/send")
def send_message(data: ChatMessage):
    database.save_message(DB_PATH, data.sender, data.receiver, data.content, data.timestamp or time.time(), data.type)
    # WebSocket推送
    with active_connections_lock:
        ws = active_connections.get(data.receiver)
    msg = {
        "type": data.type,
        "sender": data.sender,
        "content": data.content,
        "timestamp": data.timestamp or time.time()
    }
    if ws:
        import asyncio
        asyncio.create_task(ws.send_json(msg))
    return api_response(True, None, "消息已发送")

@app.get("/api/v1/history")
def get_history(user1: EmailStr = Query(...), user2: EmailStr = Query(...), limit: int = 100):
    messages = database.get_messages(DB_PATH, user1, user2, limit)
    data = [
        {
            "sender": m[0],
            "receiver": m[1],
            "content": m[2],
            "timestamp": m[3],
            "type": m[4]
        } for m in messages
    ]
    return api_response(True, data, "获取历史消息成功")

@app.post("/api/v1/delete")
def delete_message(data: DeleteMessageRequest):
    # 这里只做演示，实际应实现数据库删除
    # 可扩展：database.delete_message(DB_PATH, data.message_id)
    return api_response(True, None, "消息删除接口待实现")

@app.post("/api/v1/mark-read")
def mark_read(data: MarkReadRequest):
    # 这里只做演示，实际应实现已读标记
    return api_response(True, None, "消息已标记为已读")

# ------------------- WebSocket 聊天 -------------------

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
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
            msg_type = data.get("type", "text")
            receiver = data.get("receiver")
            msg = {
                "type": msg_type,
                "sender": user_id,
                "content": data.get("content"),
                "timestamp": data.get("timestamp", time.time())
            }
            # 保存消息
            database.save_message(DB_PATH, user_id, receiver, msg["content"], msg["timestamp"], msg_type)
            # 推送给对方
            with active_connections_lock:
                ws = active_connections.get(receiver)
            if ws:
                await ws.send_json(msg)
    except WebSocketDisconnect:
        if user_id:
            with active_connections_lock:
                if user_id in active_connections:
                    del active_connections[user_id]
