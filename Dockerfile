FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    gcc \
    pkg-config \
    libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]