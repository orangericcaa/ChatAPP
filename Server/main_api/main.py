import os
import sys
from fastapi import FastAPI, HTTPException, Query, Request, status
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
    return api_response(True, {
        "email": user["email"], 
        "name": user["name"], 
        "avatar": user.get("avatar", ""),
        "created_at": user.get("created_at", ""),
        "last_login": user.get("last_login", "")
    }, "获取用户信息成功")

@app.post("/api/v1/user/avatar")
def update_avatar(data: UpdateAvatarRequest):
    try:
        database.update_avatar(DB_PATH, data.email, data.avatar_url)
        return api_response(True, None, "头像更新成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"头像更新失败: {e}")

@app.post("/api/v1/user/info")
def update_info(data: UpdateInfoRequest):
    try:
        database.update_user_info(DB_PATH, data.email, data.name)
        return api_response(True, None, "用户信息更新成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"用户信息更新失败: {e}")

@app.get("/api/v1/user/search")
def search_user(keyword: str = Query(""), limit: int = Query(20)):
    try:
        users = database.search_users(DB_PATH, keyword, limit)
        return api_response(True, {"users": users}, "搜索用户成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索用户失败: {e}")

@app.get("/api/v1/user/status")
def get_user_status(email: EmailStr = Query(...)):
    """
    获取用户在线状态
    """
    try:
        status = database.get_user_status(DB_PATH, email)
        return api_response(True, {"status": status}, "获取用户状态成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户状态失败: {e}")

@app.post("/api/v1/user/status")
def update_user_status(email: EmailStr = Query(...), status: str = Query(...)):
    """
    更新用户在线状态
    """
    try:
        database.update_user_status(DB_PATH, email, status)
        return api_response(True, None, "用户状态更新成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"用户状态更新失败: {e}")

# ------------------- 好友管理相关接口 -------------------

@app.get("/api/v1/friends")
def get_friends(email: EmailStr = Query(...)):
    try:
        friends = database.get_friend_list(DB_PATH, email)
        return api_response(True, {"friends": friends}, "获取好友列表成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取好友列表失败: {e}")

@app.post("/api/v1/friends/add")
def add_friend(data: FriendRequest):
    try:
        # 检查用户是否存在
        if not database.find_user(DB_PATH, data.invitee):
            raise HTTPException(status_code=404, detail="被邀请用户不存在")
        
        # 检查是否已经是好友
        if database.are_friends(DB_PATH, data.inviter, data.invitee):
            raise HTTPException(status_code=400, detail="已经是好友关系")
        
        database.add_friend(DB_PATH, data.inviter, data.invitee)
        return api_response(True, None, "好友请求已发送")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"发送好友请求失败: {e}")

@app.post("/api/v1/friends/delete")
def delete_friend(data: FriendRequest):
    try:
        database.del_friend(DB_PATH, data.inviter, data.invitee)
        return api_response(True, None, "好友已删除")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除好友失败: {e}")

@app.get("/api/v1/friends/requests")
def get_friend_requests(email: EmailStr = Query(...)):
    try:
        requests = database.get_friend_requests(DB_PATH, email)
        return api_response(True, {"requests": requests}, "获取好友请求成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取好友请求失败: {e}")

@app.post("/api/v1/friends/accept")
def accept_friend(data: FriendRequest):
    try:
        database.accept_friend(DB_PATH, data.inviter, data.invitee)
        return api_response(True, None, "已同意好友请求")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"同意好友请求失败: {e}")

@app.post("/api/v1/friends/reject")
def reject_friend(data: FriendRequest):
    try:
        database.reject_friend(DB_PATH, data.inviter, data.invitee)
        return api_response(True, None, "已拒绝好友请求")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"拒绝好友请求失败: {e}")

@app.get("/api/v1/friends/mutual")
def get_mutual_friends(user1: EmailStr = Query(...), user2: EmailStr = Query(...)):
    """
    获取两个用户的共同好友
    """
    try:
        mutual_friends = database.get_mutual_friends(DB_PATH, user1, user2)
        return api_response(True, {"mutual_friends": mutual_friends}, "获取共同好友成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取共同好友失败: {e}")

# 健康检查接口
@app.get("/health")
def health_check():
    return api_response(True, {
        "status": "healthy",
        "db_path": DB_PATH,
        "service": "main_api"
    }, "主API服务运行正常")

# API信息接口
@app.get("/")
def root():
    return api_response(True, {
        "service": "ChatApp Main API",
        "version": "1.0.0",
        "endpoints": {
            "用户信息": "/api/v1/user/*",
            "好友管理": "/api/v1/friends/*",
            "健康检查": "/health",
            "API文档": "/docs"
        }
    }, "ChatApp 主API服务")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)