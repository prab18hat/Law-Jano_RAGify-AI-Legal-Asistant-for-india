#!/bin/bash
set -e  # Exit on error

echo "🔄 Updating package lists..."
apt-get update -qq

echo "📦 Installing system dependencies..."
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    poppler-utils \
    tesseract-ocr \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

echo "🐍 Setting up Python environment..."
python -m pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

echo "✅ Setup completed successfully!"
