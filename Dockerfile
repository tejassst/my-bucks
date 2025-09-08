# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Create logs directory and set permissions
RUN mkdir -p logs && chown -R nextjs:nodejs logs

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/build ./build
COPY --from=builder --chown=nextjs:nodejs /app/api ./api

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 4040

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4040/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "api/index.js"]
