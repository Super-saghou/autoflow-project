FROM node:18-alpine as build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (assuming they are in the parent directory)
COPY ./backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files (including server.js) from the backend directory into the container
COPY ./backend ./

# Expose the port that your backend app will use
EXPOSE 5000

# Start the backend server
CMD ["node", "server.js"]

