import os
import sys
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exception_handlers import RequestValidationError
from dotenv import load_dotenv

# 加载.env配置
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# 文件存储目录
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
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

def save_upload_file(upload_file: UploadFile, subdir: str):
    ext = os.path.splitext(upload_file.filename)[-1]
    filename = f"{uuid.uuid4().hex}{ext}"
    dir_path = os.path.join(UPLOAD_DIR, subdir)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, filename)
    with open(file_path, "wb") as f:
        f.write(upload_file.file.read())
    return f"{subdir}/{filename}"

# ------------------- 文件上传接口 -------------------

@app.post("/api/v1/upload/image")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="请上传图片文件")
    rel_path = save_upload_file(file, "images")
    url = f"/api/v1/download?path={rel_path}"
    return api_response(True, {"url": url}, "图片上传成功")

@app.post("/api/v1/upload/voice")
async def upload_voice(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="请上传音频文件")
    rel_path = save_upload_file(file, "voices")
    url = f"/api/v1/download?path={rel_path}"
    return api_response(True, {"url": url}, "音频上传成功")

@app.post("/api/v1/upload/video")
async def upload_video(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="请上传视频文件")
    rel_path = save_upload_file(file, "videos")
    url = f"/api/v1/download?path={rel_path}"
    return api_response(True, {"url": url}, "视频上传成功")

# ------------------- 文件下载接口 -------------------

@app.get("/api/v1/download")
async def download_file(path: str = Query(...)):
    abs_path = os.path.join(UPLOAD_DIR, path)
    if not os.path.isfile(abs_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    filename = os.path.basename(abs_path)
    return FileResponse(abs_path, filename=filename)