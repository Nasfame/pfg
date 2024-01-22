# Build stage
FROM node:20 AS builder
WORKDIR /app

#COPY package*.json pnpm-lock.yaml ./

COPY . .

RUN npm install -g pnpm
RUN pnpm install


# Deploy stage
FROM node:20-alpine


ENV NODE_ENV="production"
ENV MODE="prod"

WORKDIR /app


COPY --from=builder /app ./

LABEL maintainer="Hiro <laciferin@gmail.com>"
LABEL org.opencontainers.image.source https://github.com/Nasfame/pfg
LABEL org.opencontainers.image.title "PFG"
LABEL org.opencontainers.image.description "Novel Price Guard Protocol for volatile crypto tokens."
LABEL org.opencontainers.image.licenses Apache-2.0
LABEL org.opencontainers.image.url https://github.com/Nasfame/pfg
