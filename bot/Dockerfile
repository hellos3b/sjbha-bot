# Builder
FROM node:16 as builder

WORKDIR /app/bot

RUN npm install --global pnpm@6
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY tsconfig.json bsconfig.json ./
COPY src/ ./src/
CMD pnpm build

FROM builder as development
ENTRYPOINT pnpx rescript build -w & pnpm start

FROM builder as production
ENTRYPOINT pnpm start