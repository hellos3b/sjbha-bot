# Builder
FROM node:12-alpine as builder

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY @app/ ./@app/
COPY @services/ ./@services/
COPY @plugins/ ./@plugins/

RUN npm install && npm run build
RUN npm prune --production

# Build for production
FROM node:12-alpine as production

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

CMD npm start