# Builder
FROM node:16 as builder

WORKDIR /app

RUN npm install --global pnpm@6
COPY pnpm-lock.yaml .
RUN pnpm fetch

# Copy files required to build
ADD package*.json bsconfig.json tsconfig.json ./ 
ADD src/ ./src/

RUN pnpm install -r --offline 
RUN pnpm build:re
RUN pnpm build:ts

ENTRYPOINT pnpm start:prod