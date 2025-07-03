import os
import sys
import time
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

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

# 数据库路径
DB_PATH = paths['db_path']

# 导入数据库相关函数
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

# ------------------- Pydantic 数据模型 -------------------

class MessageSendRequest(BaseModel):
    sender: EmailStr
    receiver: EmailStr
    content: str
    type: str = "text"  # text/image/audio/video/file
    timestamp: int = int(time.time() * 1000)

class MessageQueryRequest(BaseModel):
    user1: EmailStr
    user2: EmailStr
    limit: int = 100

class GroupMessageRequest(BaseModel):
    sender: EmailStr
    group_id: str
    content: str
    type: str = "text"
    timestamp: int = int(time.time() * 1000)

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
        
        # 如果接收者在线，推送实时消息
        if data.receiver in active_connections:
            import asyncio
            asyncio.create_task(
                active_connections[data.receiver].send_json({
                    "type": "new_message",
                    "from": data.sender,
                    "content": data.content,
                    "message_type": data.type,
                    "timestamp": data.timestamp
                })
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

@app.get("/api/v1/chat-list")
def get_chat_list(user: str = Query(...)):
    """
    获取用户的聊天列表
    """
    try:
        chat_list = database.get_chat_list(DB_PATH, user)
        return api_response(True, chat_list, "获取聊天列表成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取聊天列表失败: {e}")

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
def mark_read(sender: str = Query(...), receiver: str = Query(...)):
    """
    标记与某用户的所有未读消息为已读
    """
    try:
        database.mark_messages_read(DB_PATH, sender, receiver)
        return api_response(True, None, "消息标记为已读")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"标记已读失败: {e}")

@app.get("/api/v1/unread-count")
def get_unread_count(user: str = Query(...)):
    """
    获取用户未读消息数量
    """
    try:
        count = database.get_unread_count(DB_PATH, user)
        return api_response(True, {"count": count}, "获取未读消息数量成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取未读消息数量失败: {e}")

# ------------------- 群聊接口 -------------------

@app.post("/api/v1/group/send")
def send_group_message(data: GroupMessageRequest):
    """
    发送群消息
    """
    try:
        database.save_group_message(
            DB_PATH,
            data.sender,
            data.group_id,
            data.content,
            data.type,
            data.timestamp
        )
        
        # 推送给群内在线用户
        group_members = database.get_group_members(DB_PATH, data.group_id)
        for member in group_members:
            if member != data.sender and member in active_connections:
                import asyncio
                asyncio.create_task(
                    active_connections[member].send_json({
                        "type": "group_message",
                        "from": data.sender,
                        "group_id": data.group_id,
                        "content": data.content,
                        "message_type": data.type,
                        "timestamp": data.timestamp
                    })
                )
        
        return api_response(True, None, "群消息发送成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"群消息发送失败: {e}")

@app.get("/api/v1/group/messages")
def get_group_messages(group_id: str = Query(...), limit: int = Query(100)):
    """
    获取群消息
    """
    try:
        messages = database.get_group_messages(DB_PATH, group_id, limit)
        return api_response(True, messages, "获取群消息成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取群消息失败: {e}")

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
                    await websocket.send_json({
                        "type": "system",
                        "message": "连接成功"
                    })
                    
            elif action == "send":
                to_user = data.get("to")
                message = data.get("message")
                message_type = data.get("type", "text")
                timestamp = data.get("timestamp", int(time.time() * 1000))
                
                if to_user in active_connections:
                    await active_connections[to_user].send_json({
                        "type": "new_message",
                        "from": user,
                        "message": message,
                        "message_type": message_type,
                        "timestamp": timestamp
                    })
                    
            elif action == "typing":
                to_user = data.get("to")
                if to_user in active_connections:
                    await active_connections[to_user].send_json({
                        "type": "typing",
                        "from": user
                    })
                    
            elif action == "stop_typing":
                to_user = data.get("to")
                if to_user in active_connections:
                    await active_connections[to_user].send_json({
                        "type": "stop_typing",
                        "from": user
                    })
                    
    except WebSocketDisconnect:
        if user and user in active_connections:
            del active_connections[user]
    except Exception as e:
        if user and user in active_connections:
            del active_connections[user]
        await websocket.close()

@app.get("/api/v1/online-users")
def get_online_users():
    """
    获取在线用户列表
    """
    return api_response(True, list(active_connections.keys()), "获取在线用户成功")

# 健康检查接口
@app.get("/health")
def health_check():
    return api_response(True, {
        "status": "healthy",
        "db_path": DB_PATH,
        "online_users": len(active_connections)
    }, "聊天服务运行正常")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3003)
