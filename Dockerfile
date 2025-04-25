# Stage 1: Build everything
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source & build
COPY . .
RUN yarn build

# Stage 2: Run only the built output
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built artifacts
#   - client static: /dist
#   - server bundle: /dist/server
COPY --from=builder /app/dist ./dist
# Copy runtime dependencies
COPY --from=builder /app/node_modules ./node_modules

# Create & switch to non-root user
RUN addgroup -S appgroup \
 && adduser -S appuser -G appgroup \
 && chown -R appuser:appgroup /app
USER appuser

# Listen on the port from $PORT (or 4000)
EXPOSE 4000
CMD ["node", "dist/server/index.js"]