# Builder
FROM node:16 as builder

WORKDIR /app/bot
COPY ./dist/bot.js ./dist/bot.js
COPY package.json .

ENTRYPOINT npm start