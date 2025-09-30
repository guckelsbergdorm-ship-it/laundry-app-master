# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the app with production environment
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Railway uses PORT environment variable
RUN sed -i 's/listen 80/listen ${PORT}/g' /etc/nginx/conf.d/default.conf
RUN sed -i 's/listen \[::\]:80/listen \[::\]:${PORT}/g' /etc/nginx/conf.d/default.conf

EXPOSE 80

# Use shell form to substitute environment variables
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf > /tmp/default.conf && mv /tmp/default.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"