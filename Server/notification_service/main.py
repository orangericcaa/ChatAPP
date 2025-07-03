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

class SendNotificationRequest(BaseModel):
    user: EmailStr
    content: str
    type: str = "info"
    title: str = ""

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
        
        # 发送连接成功消息
        await websocket.send_json({
            "type": "system",
            "message": "通知服务连接成功",
            "timestamp": time.time()
        })

        while True:
            data = await websocket.receive_json()
            # 处理不同类型的消息
            action = data.get("action")
            
            if action == "ping":
                await websocket.send_json({
                    "type": "pong", 
                    "timestamp": time.time()
                })
            elif action == "mark_read":
                notification_id = data.get("notification_id")
                if notification_id:
                    try:
                        database.mark_notification_read(DB_PATH, user_id, notification_id)
                        await websocket.send_json({
                            "type": "mark_read_success",
                            "notification_id": notification_id,
                            "timestamp": time.time()
                        })
                    except Exception as e:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"标记已读失败: {e}",
                            "timestamp": time.time()
                        })
            elif action == "get_unread_count":
                try:
                    count = database.get_unread_notification_count(DB_PATH, user_id)
                    await websocket.send_json({
                        "type": "unread_count",
                        "count": count,
                        "timestamp": time.time()
                    })
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"获取未读数量失败: {e}",
                        "timestamp": time.time()
                    })
                    
    except WebSocketDisconnect:
        if user_id:
            with active_connections_lock:
                if user_id in active_connections:
                    del active_connections[user_id]
    except Exception as e:
        print(f"WebSocket错误: {e}")
        if user_id:
            with active_connections_lock:
                if user_id in active_connections:
                    del active_connections[user_id]

# ------------------- HTTP API 路由 -------------------

@app.get("/api/v1/notifications")
def get_notifications(user: EmailStr = Query(...), limit: int = Query(50), offset: int = Query(0)):
    """
    获取用户通知列表
    """
    try:
        notifications = database.get_notifications(DB_PATH, user, limit, offset)
        return api_response(True, {"notifications": notifications}, "获取通知成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取通知失败: {e}")

@app.post("/api/v1/mark-read")
def mark_read(data: MarkReadRequest):
    """
    标记通知为已读
    """
    try:
        database.mark_notification_read(DB_PATH, data.user, data.notification_id)
        return api_response(True, None, "通知已标记为已读")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"标记已读失败: {e}")

@app.post("/api/v1/mark-all-read")
def mark_all_read(user: EmailStr = Query(...)):
    """
    标记所有通知为已读
    """
    try:
        database.mark_all_notifications_read(DB_PATH, user)
        return api_response(True, None, "所有通知已标记为已读")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"标记全部已读失败: {e}")

@app.get("/api/v1/unread-count")
def get_unread_count(user: EmailStr = Query(...)):
    """
    获取用户未读通知数量
    """
    try:
        count = database.get_unread_notification_count(DB_PATH, user)
        return api_response(True, {"count": count}, "获取未读数量成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取未读数量失败: {e}")

@app.post("/api/v1/send")
def send_notification(data: SendNotificationRequest):
    """
    发送通知（内部API，可用于其他服务发送通知）
    """
    try:
        # 保存通知到数据库
        notification_id = database.save_notification(
            DB_PATH,
            data.user,
            data.content,
            data.type,
            data.title,
            time.time()
        )
        
        # 如果用户在线，实时推送通知
        with active_connections_lock:
            if data.user in active_connections:
                import asyncio
                asyncio.create_task(
                    active_connections[data.user].send_json({
                        "type": "new_notification",
                        "id": notification_id,
                        "title": data.title,
                        "content": data.content,
                        "notification_type": data.type,
                        "timestamp": time.time(),
                        "is_read": False
                    })
                )
        
        return api_response(True, {"notification_id": notification_id}, "通知发送成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"发送通知失败: {e}")

@app.delete("/api/v1/notifications")
def delete_notification(user: EmailStr = Query(...), notification_id: int = Query(...)):
    """
    删除通知
    """
    try:
        database.delete_notification(DB_PATH, user, notification_id)
        return api_response(True, None, "通知已删除")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除通知失败: {e}")

@app.post("/api/v1/settings")
def update_settings(data: NotificationSettingsRequest):
    """
    更新通知设置
    """
    try:
        database.update_notification_settings(DB_PATH, data.user, data.enable)
        return api_response(True, None, "通知设置已更新")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新通知设置失败: {e}")

@app.get("/api/v1/settings")
def get_settings(user: EmailStr = Query(...)):
    """
    获取通知设置
    """
    try:
        settings = database.get_notification_settings(DB_PATH, user)
        return api_response(True, {"settings": settings}, "获取通知设置成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取通知设置失败: {e}")

@app.get("/api/v1/online-users")
def get_online_users():
    """
    获取当前在线用户列表（用于调试）
    """
    with active_connections_lock:
        online_users = list(active_connections.keys())
    return api_response(True, {"online_users": online_users, "count": len(online_users)}, "获取在线用户成功")

# 健康检查接口
@app.get("/health")
def health_check():
    with active_connections_lock:
        online_count = len(active_connections)
    
    return api_response(True, {
        "status": "healthy",
        "db_path": DB_PATH,
        "service": "notification_service",
        "online_users": online_count
    }, "通知服务运行正常")

# API信息接口
@app.get("/")
def root():
    return api_response(True, {
        "service": "ChatApp Notification Service",
        "version": "1.0.0",
        "endpoints": {
            "通知管理": "/api/v1/notifications",
            "实时通知": "/ws/notification",
            "通知设置": "/api/v1/settings",
            "健康检查": "/health",
            "API文档": "/docs"
        }
    }, "ChatApp 通知服务")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3006)