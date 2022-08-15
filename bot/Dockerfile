# Builder
FROM node:16 as builder

WORKDIR /app

RUN npm install --global pnpm@6
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --production

# Copy files required to build

# ADD package*.json bsconfig.json tsconfig.json ./ 
# ADD src/ ./src/

COPY build/ ./build/

# RUN pnpm build:re
# RUN pnpm build:ts

ENTRYPOINT pnpm start:prod