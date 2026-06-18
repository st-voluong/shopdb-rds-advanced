# STAGE 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# STAGE 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json tsconfig.json ./
COPY . .

RUN npm run build

# STAGE 3: Filter dependencies for production
FROM node:18-alpine AS prod-deps
WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# STAGE 4: Final image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

USER node

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/package.json ./package.json

EXPOSE 5000

CMD ["node", "dist/server.js"]