FROM python:3.12-slim

WORKDIR /app

# System deps (needed for psycopg2-binary and cryptography)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create upload dir inside image (also mounted as volume in compose)
RUN mkdir -p uploads/certifications

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
