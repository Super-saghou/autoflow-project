# Use Node.js base image with Python support
FROM node:18-alpine

# Install Python, pip, and system dependencies
RUN apk add --no-cache \
    bash \
    python3 \
    py3-pip \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    openssl-dev \
    cargo \
    git \
    curl

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy Python requirements and install Python dependencies
COPY requirements.txt ./
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# Install additional Python packages for network automation
RUN pip install --no-cache-dir \
    netmiko==4.6.0 \
    paramiko==3.3.1 \
    ansible==8.5.0 \
    PyYAML>=6.0.2 \
    requests==2.31.0

# Copy the rest of the project files
COPY . .

# Create necessary directories
RUN mkdir -p /app/backups /app/logs /app/generated_playbooks

# Make startup script executable
RUN chmod +x /app/start_services.sh

# Expose the ports your backend will use
EXPOSE 5000 5010 5001 5003

# Use environment variable for MongoDB URL (can be overridden at runtime)
ENV MONGO_URL=mongodb+srv://sarrabngharbia:1pA39c9rUl7I0SR8@cluster0.evbzs.mongodb.net/products?retryWrites=true&w=majority&appName=Cluster0
ENV NODE_ENV=production
ENV BACKUP_DIR=/app/backups
ENV PYTHONPATH=/app
ENV GENERATED_PLAYBOOKS_DIR=/app/generated_playbooks

CMD ["/app/start_services.sh"]

