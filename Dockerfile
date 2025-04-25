# Use Node.js LTS version with a specific digest for better security
FROM node:20-alpine@sha256:2f46fd49c767554c089a5eb219115313b72748d8f62f5eccb58ef52bc36db4ad

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set proper permissions
RUN mkdir -p /app && chown -R appuser:appgroup /app

# Set working directory and switch to non-root user
WORKDIR /app
USER appuser

# Install dependencies first (for better caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Build the application
RUN yarn build

# Expose the port the app runs on
EXPOSE 5001

# Start the application
CMD ["yarn", "start"]
