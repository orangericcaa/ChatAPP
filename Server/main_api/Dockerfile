FROM python:3.11

WORKDIR /app

# 复制当前服务代码到容器
COPY . /app

# 如果 requirements.txt 在上级目录，复制它
COPY ../requirements.txt /app/requirements.txt

# 安装依赖
RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt

# 安装 email-validator（如果 requirements.txt 没有包含）
RUN pip install email-validator

EXPOSE 3001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001", "--