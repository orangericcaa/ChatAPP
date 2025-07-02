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

# ------------------- WebSocket连接管理 -------------------

active_connections = {}
active_connections_lock = threading.Lock()

# ------------------- HTTP API 路由 -------------------

@app.post("/api/v1/call/initiate")
def initiate_call(data: CallRequest):
    session_id = f"{data.caller}_{data.callee}_{int(time.time())}"
    database.create_video_session(DB_PATH, session_id, data.caller, data.callee)
    # 可在此处通知被叫（如推送到WebSocket）
    return api_response(True, {"session_id": session_id}, "通话请求已发起")

@app.post("/api/v1/call/accept")
def accept_call(data: CallActionRequest):
    database.update_video_session_status(DB_PATH, data.session_id, "accepted")
    # 可在此处通知对方
    return api_response(True, None, "通话已接受")

@app.post("/api/v1/call/reject")
def reject_call(data: CallActionRequest):
    database.update_video_session_status(DB_PATH, data.session_id, "rejected")
    return api_response(True, None, "通话已拒绝")

@app.post("/api/v1/call/end")
def end_call(data: EndCallRequest):
    database.update_video_session_status(DB_PATH, data.session_id, "ended")
    return api_response(True, None, "通话已结束")

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
            await websocket.close()
            return
        with active_connections_lock:
            active_connections[user_id] = websocket

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            # 信令转发（如呼叫、接受、拒绝、挂断、媒体协商等）
            target_id = data.get("target_id") or data.get("callee") or data.get("caller")
            if target_id:
                with active_connections_lock:
                    ws = active_connections.get(target_id)
                if ws:
                    await ws.send_json({
                        **data,
                        "from": user_id,
                        "timestamp": time.time()
                    })
    except WebSocketDisconnect:
        if user_id:
            with active_connections_lock:
                if user_id in active_connections:
                    del active_connections[user_id]