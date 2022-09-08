# Builder
FROM node:16 as builder

WORKDIR /app/bot
RUN npm install --global pnpm@6
COPY package.json pnpm-lock.yaml ./
RUN pnpm install


FROM builder as development
COPY tsconfig.json bsconfig.json ./
ENTRYPOINT pnpm rescript & pnpm dev


FROM builder as production
COPY tsconfig.json bsconfig.json ./
COPY src/ ./src/
RUN pnpm build
ENTRYPOINT pnpm start