# STAGE 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# STAGE 2: Build static assets (HTMl, CSS, JS)
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY . .

RUN npm run build

# STAGE 3: Use Nginx to serve static assets
FROM nginx:1.25-alpine AS runner

# Delete files default of Nginx to avoid conflict
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]