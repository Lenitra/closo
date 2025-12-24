FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_CACHE_DIR=/tmp/uv-cache

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set work directory
WORKDIR /app

# Copy uv configuration files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv sync
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Créer le dossier de stockage
RUN mkdir -p /app/storage

ENV STORAGE_DIR=/app/storage
ENV PORT=8060

EXPOSE 8060

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8060"]
