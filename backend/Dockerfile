FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Add src to python path
ENV PYTHONPATH=/app/src

CMD ["uvicorn", "src.infrastructure.main:app", "--host", "0.0.0.0", "--port", "8000"]
