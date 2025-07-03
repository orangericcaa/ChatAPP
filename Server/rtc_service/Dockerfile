FROM python:3.11

WORKDIR /app

# 复制当前服务代码到容器
COPY . /app

# 复制 requirements.txt 到容器
COPY requirements.txt /app/requirements.txt

# 安装依赖
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r /app/requirements.txt

EXPOSE 3005

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3005", "--reload"]