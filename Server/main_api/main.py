import os
import sys
from fastapi import FastAPI, HTTPException, Query, Request, status
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

class UserProfileRequest(BaseModel):
    email: EmailStr

class UpdateAvatarRequest(BaseModel):
    email: EmailStr
    avatar_url: str

class UpdateInfoRequest(BaseModel):
    email: EmailStr
    name: str

class SearchUserRequest(BaseModel):
    keyword: str

class FriendRequest(BaseModel):
    inviter: EmailStr
    invitee: EmailStr

# ------------------- 用户信息相关接口 -------------------

@app.get("/api/v1/user/profile")
def get_user_profile(email: EmailStr = Query(...)):
    user = database.find_user(DB_PATH, email)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return api_response(True, {"email": user["email"], "name": user["name"], "avatar": user.get("avatar", "")}, "获取用户信息成功")

@app.post("/api/v1/user/avatar")
def update_avatar(data: UpdateAvatarRequest):
    database.update_avatar(DB_PATH, data.email, data.avatar_url)
    return api_response(True, None, "头像更新成功")

@app.post("/api/v1/user/info")
def update_info(data: UpdateInfoRequest):
    database.update_user_info(DB_PATH, data.email, data.name)
    return api_response(True, None, "用户信息更新成功")

@app.get("/api/v1/user/search")
def search_user(keyword: str = Query("")):
    users = database.search_users(DB_PATH, keyword)
    return api_response(True, {"users": users}, "搜索用户成功")

# ------------------- 好友管理相关接口 -------------------

@app.get("/api/v1/friends")
def get_friends(email: EmailStr = Query(...)):
    friends = database.get_friend_list(DB_PATH, email)
    return api_response(True, {"friends": friends}, "获取好友列表成功")

@app.post("/api/v1/friends/add")
def add_friend(data: FriendRequest):
    database.add_friend(DB_PATH, data.inviter, data.invitee)
    return api_response(True, None, "好友请求已发送")

@app.post("/api/v1/friends/delete")
def delete_friend(data: FriendRequest):
    database.del_friend(DB_PATH, data.inviter, data.invitee)
    return api_response(True, None, "好友已删除")

@app.get("/api/v1/friends/requests")
def get_friend_requests(email: EmailStr = Query(...)):
    requests = database.get_friend_requests(DB_PATH, email)
    return api_response(True, {"requests": requests}, "获取好友请求成功")

@app.post("/api/v1/friends/accept")
def accept_friend(data: FriendRequest):
    database.accept_friend(DB_PATH, data.inviter, data.invitee)
    return api_response(True, None, "已同意好友请求")

@app.post("/api/v1/friends/reject")
def reject_friend(data: FriendRequest):
    database.reject_friend(DB_PATH, data.inviter, data.invitee)
    return api_response(True, None, "已拒绝好友请求")