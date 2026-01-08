FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache nginx

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

RUN rm -f /etc/nginx/conf.d/default.conf && mkdir -p /run/nginx

CMD sh -c 'nginx -g "daemon off;" & node server.js'
