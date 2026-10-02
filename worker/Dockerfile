# Stage 1: Build whisper.cpp binary
FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /whisper.cpp
COPY whisper.cpp/ .
RUN rm -rf build CMakeCache.txt CMakeFiles && \
    cmake -B build \
    -DGGML_NATIVE=OFF \
    -DBUILD_SHARED_LIBS=OFF \
    -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --config Release -j $(nproc)

# Stage 2: Final minimal runtime
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install runtime dependencies: FFmpeg & C++ runtime libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy whisper binary from builder
COPY --from=builder /whisper.cpp/build/bin/whisper-cli /usr/local/bin/whisper-cli

# Copy model weights
RUN mkdir -p /app/models
COPY whisper.cpp/models/ggml-base.en.bin /app/models/ggml-base.en.bin

# Install CPU PyTorch first (much smaller than CUDA PyTorch ~300MB vs 3GB)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
COPY worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker application code
COPY worker/ .

# Environment defaults for worker
ENV WHISPER_EXECUTABLE=/usr/local/bin/whisper-cli
ENV WHISPER_MODEL_PATH=/app/models/ggml-base.en.bin

CMD ["python", "queue_worker.py"]
