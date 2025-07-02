import os
import sys
import time
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

# ------------------- Pydantic 数据模型 -------------------

class MessageSendRequest(BaseModel):
    sender: EmailStr
    receiver: EmailStr
    content: str
    type: str = "text"  # text/image/audio
    timestamp: int = int(time.time() * 1000)

class MessageQueryRequest(BaseModel):
    user1: EmailStr
    user2: EmailStr
    limit: int = 100

# ------------------- 聊天消息接口 -------------------

@app.get("/api/v1/messages")
def get_messages(user1: str = Query(...), user2: str = Query(...), limit: int = Query(100)):
    """
    获取两用户之间的消息
    """
    try:
        messages = database.get_messages(DB_PATH, user1, user2, limit)
        return api_response(True, messages, "获取消息成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取消息失败: {e}")

@app.post("/api/v1/send")
def send_message(data: MessageSendRequest):
    """
    发送消息
    """
    try:
        database.save_message(
            DB_PATH,
            data.sender,
            data.receiver,
            data.content,
            data.type,
            data.timestamp
        )
        return api_response(True, None, "消息发送成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"消息发送失败: {e}")

@app.get("/api/v1/history")
def get_history(user: str = Query(...), limit: int = Query(100)):
    """
    获取用户历史消息
    """
    try:
        messages = database.get_user_history(DB_PATH, user, limit)
        return api_response(True, messages, "获取历史消息成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史消息失败: {e}")

@app.post("/api/v1/delete")
def delete_message(message_id: int = Query(...)):
    """
    删除消息
    """
    try:
        database.delete_message(DB_PATH, message_id)
        return api_response(True, None, "消息删除成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"消息删除失败: {e}")

@app.post("/api/v1/mark-read")
def mark_read(message_id: int = Query(...)):
    """
    标记消息为已读
    """
    try:
        database.mark_message_read(DB_PATH, message_id)
        return api_response(True, None, "消息标记为已读")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"标记已读失败: {e}")

# ------------------- WebSocket 聊天 -------------------

active_connections = {}

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    user = None
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            if action == "register":
                user = data.get("user")
                if user:
                    active_connections[user] = websocket
            elif action == "send":
                to_user = data.get("to")
                message = data.get("message")
                if to_user in active_connections:
                    await active_connections[to_user].send_json({
                        "from": user,
                        "message": message
                    })
    except WebSocketDisconnect:
        if user and user in active_connections:
            del active_connections[user]
    except Exception as e:
        await websocket.close()
