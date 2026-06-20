FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (only production if needed, but we build here so install all)
RUN npm install

# Copy application files
COPY . .

# Build the frontend and backend
RUN npm run build

# Expose port (Cloud Run defaults to 8080, but we use PORT env variable which is set by Cloud Run)
EXPOSE 3000

# Start server
CMD ["npm", "start"]
