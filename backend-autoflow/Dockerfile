# Use Node.js base image with Python support
FROM node:18-alpine

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

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

# Copy the rest of the project files
COPY . .

# Expose the port your backend will use
EXPOSE 5000

# Use environment variable for MongoDB URL (can be overridden at runtime)
ENV MONGO_URL=mongodb+srv://sarrabngharbia:1pA39c9rUl7I0SR8@cluster0.evbzs.mongodb.net/products?retryWrites=true&w=majority&appName=Cluster0

# Start the server
CMD ["node", "server.js"]

