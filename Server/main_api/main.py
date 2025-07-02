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

class UpdateAvatarRequest(BaseModel):
    email: EmailStr
    avatar_url: str

class UpdateInfoRequest(BaseModel):
    email: EmailStr
    name: str

class SearchUserRequest(BaseModel):
    keyword: str

class AddFriendRequest(BaseModel):
    inviter: EmailStr
    invitee: EmailStr

class FriendActionRequest(BaseModel):
    inviter: EmailStr
    invitee: EmailStr

class DeleteFriendRequest(BaseModel):
    email1: EmailStr
    email2: EmailStr

# ------------------- 用户相关接口 -------------------

@app.get("/api/v1/user/profile")
def get_profile(email: EmailStr = Query(...)):
    username = database.find_user(DB_PATH, email)
    if not username:
        raise HTTPException(status_code=404, detail="用户不存在")
    return api_response(True, {"email": email, "name": username}, "获取用户信息成功")

@app.put("/api/v1/user/avatar")
def update_avatar(data: UpdateAvatarRequest):
    # 这里只做示例，实际应保存avatar_url到数据库
    # 可扩展：database.update_user_avatar(DB_PATH, data.email, data.avatar_url)
    return api_response(True, {"avatar_url": data.avatar_url}, "头像更新成功")

@app.put("/api/v1/user/info")
def update_info(data: UpdateInfoRequest):
    database.update_user_name(DB_PATH, data.email, data.name)
    return api_response(True, None, "信息更新成功")

@app.get("/api/v1/user/search")
def search_user(keyword: str = Query(...)):
    # 简单实现：模糊搜索邮箱或用户名
    # 可扩展：实现 database.search_user(DB_PATH, keyword)
    # 这里只返回全部用户做演示
    import sqlite3
    result = []
    with sqlite3.connect(DB_PATH) as db_conn:
        cursor = db_conn.cursor()
        cursor.execute("SELECT email, username FROM UserTable WHERE email LIKE ? OR username LIKE ?", (f"%{keyword}%", f"%{keyword}%"))
        for row in cursor.fetchall():
            result.append({"email": row[0], "name": row[1]})
    return api_response(True, {"users": result}, "搜索用户成功")

# ------------------- 好友管理相关接口 -------------------

@app.get("/api/v1/friends")
def get_friends(email: EmailStr = Query(...)):
    friends = database.get_friend_list(DB_PATH, email)
    return api_response(True, {"friends": [{"email": f[0], "name": f[1]} for f in friends]}, "获取好友列表成功")

@app.post("/api/v1/friends/add")
def add_friend(data: AddFriendRequest):
    if data.inviter == data.invitee:
        raise HTTPException(status_code=400, detail="不能添加自己为好友")
    database.raise_friend_request(DB_PATH, data.inviter, data.invitee)
    return api_response(True, None, "好友请求已发送")

@app.get("/api/v1/friends/requests")
def get_friend_requests(email: EmailStr = Query(...)):
    requests = database.get_friend_request(DB_PATH, email)
    return api_response(True, {"requests": requests}, "获取好友请求成功")

@app.post("/api/v1/friends/accept")
def accept_friend(data: FriendActionRequest):
    database.add_friend(DB_PATH, data.inviter, data.invitee)
    return api_response(True, None, "已添加为好友")

@app.post("/api/v1/friends/reject")
def reject_friend(data: FriendActionRequest):
    # 这里只做删除请求，实际可扩展
    import sqlite3
    with sqlite3.connect(DB_PATH) as db_conn:
        db_conn.execute("DELETE FROM FriendRequest WHERE inviter=? AND invitee=?", (data.inviter, data.invitee))
        db_conn.commit()
    return api_response(True, None, "已拒绝好友请求")

@app.post("/api/v1/friends/delete")
def delete_friend(data: DeleteFriendRequest):
    database.del_friend(DB_PATH, data.email1, data.email2)
    return api_response(True, None, "好友已删除")