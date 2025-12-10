# Node.js Frontend Server Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production

# Run the production server
CMD ["npm", "run", "start"]

