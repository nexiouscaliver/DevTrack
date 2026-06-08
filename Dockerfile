# Stage 1: Build the frontend
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:22-slim

# Git CLI required for repository tracking features
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./

# Install all production dependencies from package.json.
# This includes frontend libs (react, recharts, etc.) that are already
# bundled into dist/ — they're unused at runtime but don't significantly
# affect the image since only express is loaded by the server process.
RUN npm ci --omit=dev

COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# Ensure data directory is writable by the node user
RUN mkdir -p /app/server/data && chown node:node /app/server/data

# Run as non-root user (node:22-slim includes the 'node' user)
USER node

# Defaults — can be overridden via docker-compose or docker run -e
ENV PORT=9000
ENV BIND_ADDR=0.0.0.0

EXPOSE 9000
CMD ["node", "server/git-server.mjs"]
