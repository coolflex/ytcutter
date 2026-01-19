# Use Python 3.9 slim as base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies including Node.js, FFmpeg, and build tools
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy all project files
COPY . .

# Build the Vite frontend
RUN npm run build

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 7860 for Hugging Face
EXPOSE 7860

# Set environment variable for port
ENV PORT=7860

# Run the Flask app with gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app", "--timeout", "120"]
