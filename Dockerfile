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
LABEL org.opencontainers.image.source https://github.com/Web3Mustketeers/web3.sub
LABEL org.opencontainers.image.title "Web3Sub"
LABEL org.opencontainers.image.description "Web3Sub is on chain service that provides Dapps the facility to subscribe, unsubscribe & verify wallet users"
LABEL org.opencontainers.image.licenses Apache-2.0
LABEL org.opencontainers.image.url https://github.com/Web3Mustketeers/web3.sub
