# ── Stage 1: Build Angular app ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular app
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# SPA routing: redirect all 404s back to index.html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
