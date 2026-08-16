# 1) Vite 프론트 빌드
FROM node:22-alpine AS frontend

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

# 같은 오리진(nginx)으로 API 호출 → 빈 문자열 = 상대 경로
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

RUN npx vite build

# 2) nginx
FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1