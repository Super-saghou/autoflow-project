# Use Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the port your backend will use
EXPOSE 5000
ENV MONGO_URL=mongodb+srv://sarrabngharbia:1pA39c9rUl7I0SR8@cluster0.evbzs.mongodb.net/products?retryWrites=true&w=majority&appName=Cluster0
# Start the server

CMD ["node", "server.js"]

