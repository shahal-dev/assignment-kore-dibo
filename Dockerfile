# Use Node.js base image
FROM node:20-alpine@sha256:2f46fd49c767554c089a5eb219115313b72748d8f62f5eccb58ef52bc36db4ad

# Create app user and set permissions
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app && chown -R appuser:appgroup /app

# Set working directory
WORKDIR /app
USER appuser

# Copy and install backend dependencies
COPY server/package.json server/yarn.lock ./server/
RUN cd server && yarn install --frozen-lockfile

# Copy and build frontend
COPY client ./client
RUN cd client && yarn install && yarn build

# Copy backend source code
COPY server ./server

# Copy built frontend into backend's public directory (adjust if needed)
RUN mkdir -p /app/server/dist/client && cp -r /app/client/dist/* /app/server/dist/client/

# Build the backend
RUN cd server && yarn build

# Expose the backend port
EXPOSE 4000

# Start the backend
CMD ["node", "server/dist/server/index.js"]
