# Builder
FROM node:16 as builder

WORKDIR /app/bot
RUN npm install --global pnpm@6
COPY package.json pnpm-lock.yaml ./
RUN pnpm install


FROM builder as development
COPY demo.js .
COPY tsconfig.json bsconfig.json ./
# ENTRYPOINT node demo.js
ENTRYPOINT pnpm rescript & pnpm dev


FROM builder as production
COPY src/ ./src/
CMD pnpm build
ENTRYPOINT pnpm start