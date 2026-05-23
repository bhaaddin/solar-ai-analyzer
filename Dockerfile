# Use official Node.js image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy entire project
COPY . .

# Set the port
ENV PORT=3001

# Expose port 3001
EXPOSE 3001

# Start the application
CMD ["node", "server.js"]
