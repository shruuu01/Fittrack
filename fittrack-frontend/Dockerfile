# Use Node.js official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package dependencies
COPY package*.json ./

# Install packages
RUN npm install

# Copy all source files
COPY . .

# Build production next app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
