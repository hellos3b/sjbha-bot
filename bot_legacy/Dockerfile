# Builder
FROM node:16 as builder

WORKDIR /app/legacy

RUN npm install --global pnpm@6
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY config ./config/
COPY lib ./lib/
COPY plugins ./plugins/
COPY utils ./utils/
COPY .babelrc app.js tsconfig.json ./

ENTRYPOINT pnpm start