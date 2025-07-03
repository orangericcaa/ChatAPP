import os
import sys
import time
import threading
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, Request, status, BackgroundTasks
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

class CallRequest(BaseModel):
    caller: EmailStr
    callee: EmailStr

class CallActionRequest(BaseModel):
    session_id: str
    user: EmailStr

class EndCallRequest(BaseModel):
    session_id: str
    user: EmailStr

class GetCallHistoryRequest(BaseModel):
    user: EmailStr
    limit: int = 50

# ------------------- WebSocket连接管理 -------------------

active_connections = {}
active_connections_lock = threading.Lock()

# 线程池用于异步推送
executor = ThreadPoolExecutor(max_workers=10)

# ------------------- WebSocket 推送辅助函数 -------------------

async def send_websocket_message_async(websocket: WebSocket, message: dict):
    """异步发送 WebSocket 消息"""
    try:
        await websocket.send_json(message)
        return True
    except Exception as e:
        print(f"WebSocket 消息发送失败: {e}")
        return False

def send_websocket_message_sync(websocket: WebSocket, message: dict):
    """同步环境下发送 WebSocket 消息"""
    try:
        # 创建新的事件循环来处理异步操作
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(send_websocket_message_async(websocket, message))
            return result
        finally:
            loop.close()
    except Exception as e:
        print(f"同步发送 WebSocket 消息失败: {e}")
        return False

def notify_user_async(user_id: str, message: dict):
    """异步通知用户（在同步函数中使用）"""
    def _notify():
        with active_connections_lock:
            if user_id in active_connections:
                websocket = active_connections[user_id]
                return send_websocket_message_sync(websocket, message)
        return False
    
    # 在线程池中执行
    future = executor.submit(_notify)
    return future

async def notify_user_sync(user_id: str, message: dict):
    """在异步环境中通知用户"""
    with active_connections_lock:
        if user_id in active_connections:
            websocket = active_connections[user_id]
            return await send_websocket_message_async(websocket, message)
    return False

def notify_multiple_users(user_ids: list, message: dict):
    """批量通知多个用户"""
    futures = []
    for user_id in user_ids:
        if user_id:
            future = notify_user_async(user_id, message)
            futures.append(future)
    return futures

# ------------------- HTTP API 路由 -------------------

@app.post("/api/v1/call/initiate")
async def initiate_call(data: CallRequest, background_tasks: BackgroundTasks):
    """
    发起视频通话
    """
    try:
        session_id = f"{data.caller}_{data.callee}_{int(time.time())}"
        database.create_video_session(DB_PATH, session_id, data.caller, data.callee)
        
        # 异步推送通话请求给被叫用户
        message = {
            "type": "incoming_call",
            "session_id": session_id,
            "caller": data.caller,
            "timestamp": time.time()
        }
        
        # 使用 BackgroundTasks 进行异步推送
        background_tasks.add_task(notify_user_sync, data.callee, message)
        
        return api_response(True, {"session_id": session_id}, "通话请求已发起")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"发起通话失败: {e}")

@app.post("/api/v1/call/accept")
async def accept_call(data: CallActionRequest, background_tasks: BackgroundTasks):
    """
    接受视频通话
    """
    try:
        database.update_video_session_status(DB_PATH, data.session_id, "accepted")
        
        # 通知主叫方通话已被接受
        session_info = database.get_video_session(DB_PATH, data.session_id)
        if session_info:
            caller = session_info.get("caller")
            if caller:
                message = {
                    "type": "call_accepted",
                    "session_id": data.session_id,
                    "accepter": data.user,
                    "timestamp": time.time()
                }
                background_tasks.add_task(notify_user_sync, caller, message)
        
        return api_response(True, None, "通话已接受")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"接受通话失败: {e}")

@app.post("/api/v1/call/reject")
async def reject_call(data: CallActionRequest, background_tasks: BackgroundTasks):
    """
    拒绝视频通话
    """
    try:
        database.update_video_session_status(DB_PATH, data.session_id, "rejected")
        
        # 通知主叫方通话已被拒绝
        session_info = database.get_video_session(DB_PATH, data.session_id)
        if session_info:
            caller = session_info.get("caller")
            if caller:
                message = {
                    "type": "call_rejected",
                    "session_id": data.session_id,
                    "rejecter": data.user,
                    "timestamp": time.time()
                }
                background_tasks.add_task(notify_user_sync, caller, message)
        
        return api_response(True, None, "通话已拒绝")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"拒绝通话失败: {e}")

@app.post("/api/v1/call/end")
async def end_call(data: EndCallRequest, background_tasks: BackgroundTasks):
    """
    结束视频通话
    """
    try:
        database.update_video_session_status(DB_PATH, data.session_id, "ended")
        
        # 通知通话参与者通话已结束
        session_info = database.get_video_session(DB_PATH, data.session_id)
        if session_info:
            caller = session_info.get("caller")
            callee = session_info.get("callee")
            
            # 确定通知对象（除了发起结束的用户）
            notify_users = []
            if caller and caller != data.user:
                notify_users.append(caller)
            if callee and callee != data.user:
                notify_users.append(callee)
            
            message = {
                "type": "call_ended",
                "session_id": data.session_id,
                "ended_by": data.user,
                "timestamp": time.time()
            }
            
            # 批量通知
            for user_id in notify_users:
                background_tasks.add_task(notify_user_sync, user_id, message)
        
        return api_response(True, None, "通话已结束")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"结束通话失败: {e}")

@app.get("/api/v1/call/history")
async def get_call_history(user: EmailStr = Query(...), limit: int = Query(50)):
    """
    获取通话历史记录
    """
    try:
        history = database.get_video_call_history(DB_PATH, user, limit)
        return api_response(True, {"history": history}, "获取通话历史成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取通话历史失败: {e}")

@app.get("/api/v1/call/session")
async def get_call_session(session_id: str = Query(...)):
    """
    获取通话会话信息
    """
    try:
        session_info = database.get_video_session(DB_PATH, session_id)
        if not session_info:
            raise HTTPException(status_code=404, detail="通话会话不存在")
        return api_response(True, {"session": session_info}, "获取会话信息成功")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"获取会话信息失败: {e}")

@app.get("/api/v1/call/active")
async def get_active_calls(user: EmailStr = Query(...)):
    """
    获取用户的活跃通话
    """
    try:
        active_calls = database.get_active_video_calls(DB_PATH, user)
        return api_response(True, {"active_calls": active_calls}, "获取活跃通话成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取活跃通话失败: {e}")

# ------------------- WebSocket 实时信令 -------------------

@app.websocket("/ws/rtc")
async def rtc_websocket(websocket: WebSocket):
    await websocket.accept()
    user_id = None
    try:
        # 首条消息应包含用户身份
        init_data = await websocket.receive_json()
        user_id = init_data.get("user_id")
        if not user_id:
            await websocket.send_json({
                "type": "error",
                "message": "缺少用户ID",
                "timestamp": time.time()
            })
            await websocket.close()
            return
        
        # 注册连接
        with active_connections_lock:
            # 如果用户已经有连接，关闭旧连接
            if user_id in active_connections:
                old_ws = active_connections[user_id]
                try:
                    await old_ws.close()
                except:
                    pass
            active_connections[user_id] = websocket
        
        print(f"RTC WebSocket用户 {user_id} 连接成功")
        
        # 发送连接成功消息
        await websocket.send_json({
            "type": "connected",
            "message": "RTC服务连接成功",
            "user_id": user_id,
            "timestamp": time.time()
        })

        while True:
            try:
                data = await websocket.receive_json()
                msg_type = data.get("type")
                
                # 心跳检测
                if msg_type == "ping":
                    await websocket.send_json({
                        "type": "pong", 
                        "timestamp": time.time()
                    })
                    continue
                
                # WebRTC信令转发（如offer、answer、ice-candidate等）
                target_id = data.get("target_id") or data.get("callee") or data.get("caller")
                if target_id:
                    with active_connections_lock:
                        target_ws = active_connections.get(target_id)
                    
                    if target_ws:
                        try:
                            # 转发消息给目标用户
                            forward_data = {
                                **data,
                                "from": user_id,
                                "timestamp": time.time()
                            }
                            await target_ws.send_json(forward_data)
                            
                            # 发送转发成功确认
                            await websocket.send_json({
                                "type": "forward_success",
                                "original_type": msg_type,
                                "target_id": target_id,
                                "timestamp": time.time()
                            })
                        except Exception as e:
                            print(f"转发消息给 {target_id} 失败: {e}")
                            # 移除失效连接
                            with active_connections_lock:
                                if target_id in active_connections:
                                    del active_connections[target_id]
                            
                            await websocket.send_json({
                                "type": "error",
                                "message": f"用户 {target_id} 连接已断开",
                                "original_type": msg_type,
                                "timestamp": time.time()
                            })
                    else:
                        # 目标用户不在线
                        await websocket.send_json({
                            "type": "error",
                            "message": f"用户 {target_id} 不在线",
                            "original_type": msg_type,
                            "timestamp": time.time()
                        })
                else:
                    # 没有指定目标用户
                    await websocket.send_json({
                        "type": "error",
                        "message": "缺少目标用户ID",
                        "original_type": msg_type,
                        "timestamp": time.time()
                    })
                    
            except Exception as e:
                print(f"处理消息失败: {e}")
                break
                
    except WebSocketDisconnect:
        print(f"RTC WebSocket用户 {user_id} 正常断开连接")
    except Exception as e:
        print(f"RTC WebSocket错误: {e}")
    finally:
        # 清理连接
        if user_id:
            with active_connections_lock:
                if user_id in active_connections:
                    del active_connections[user_id]
            print(f"已清理用户 {user_id} 的连接")

@app.get("/api/v1/online-users")
async def get_online_users():
    """
    获取当前在线用户列表（用于调试）
    """
    with active_connections_lock:
        online_users = list(active_connections.keys())
    return api_response(True, {"online_users": online_users, "count": len(online_users)}, "获取在线用户成功")

# 健康检查接口
@app.get("/health")
async def health_check():
    with active_connections_lock:
        online_count = len(active_connections)
    
    return api_response(True, {
        "status": "healthy",
        "db_path": DB_PATH,
        "service": "rtc_service",
        "online_users": online_count,
        "timestamp": time.time()
    }, "RTC服务运行正常")

# API信息接口
@app.get("/")
async def root():
    return api_response(True, {
        "service": "ChatApp RTC Service",
        "version": "1.0.0",
        "endpoints": {
            "通话管理": "/api/v1/call/*",
            "实时信令": "/ws/rtc",
            "通话历史": "/api/v1/call/history",
            "健康检查": "/health",
            "API文档": "/docs"
        }
    }, "ChatApp RTC服务")

# 优雅关闭处理
@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理资源"""
    print("正在关闭 RTC 服务...")
    
    # 关闭所有 WebSocket 连接
    with active_connections_lock:
        connections = list(active_connections.values())
        active_connections.clear()
    
    for ws in connections:
        try:
            await ws.close()
        except:
            pass
    
    # 关闭线程池
    executor.shutdown(wait=True)
    print("RTC 服务已关闭")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3005)