import os
import sys
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exception_handlers import RequestValidationError
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
            'upload_dir': '/uploads'
        }
    else:
        # 本地开发路径
        return {
            'env_path': os.path.join(current_dir, '..', 'common', '.env'),
            'upload_dir': os.path.join(current_dir, '..', 'uploads')
        }

paths = get_paths()

# 加载.env配置
load_dotenv(dotenv_path=paths['env_path'])

# 文件存储目录
UPLOAD_DIR = os.path.abspath(paths['upload_dir'])
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

# ------------------- 文件上传与下载接口 -------------------

@app.post("/api/v1/upload/image")
async def upload_image(file: UploadFile = File(...)):
    try:
        filename = f"img_{int(os.times()[4]*1000)}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return api_response(True, {"url": f"/api/v1/download?filename={filename}"}, "图片上传成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图片上传失败: {e}")

@app.post("/api/v1/upload/voice")
async def upload_voice(file: UploadFile = File(...)):
    try:
        filename = f"voice_{int(os.times()[4]*1000)}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return api_response(True, {"url": f"/api/v1/download?filename={filename}"}, "语音上传成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"语音上传失败: {e}")

@app.post("/api/v1/upload/video")
async def upload_video(file: UploadFile = File(...)):
    try:
        filename = f"video_{int(os.times()[4]*1000)}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return api_response(True, {"url": f"/api/v1/download?filename={filename}"}, "视频上传成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"视频上传失败: {e}")

@app.get("/api/v1/download")
async def download_file(filename: str = Query(...)):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(file_path, filename=filename)

@app.post("/api/v1/upload/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    try:
        filename = f"avatar_{int(os.times()[4]*1000)}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return api_response(True, {"url": f"/api/v1/download?filename={filename}"}, "头像上传成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"头像上传失败: {e}")

@app.post("/api/v1/upload/file")
async def upload_file(file: UploadFile = File(...)):
    try:
        filename = f"file_{int(os.times()[4]*1000)}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return api_response(True, {"url": f"/api/v1/download?filename={filename}"}, "文件上传成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {e}")

# 健康检查接口
@app.get("/health")
async def health_check():
    return api_response(True, {"status": "healthy", "upload_dir": UPLOAD_DIR}, "文件服务运行正常")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3004)