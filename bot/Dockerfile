# Builder
FROM node:16-alpine as builder

WORKDIR /app

# Copy files required to build
COPY package*.json tsconfig.json ./ 
COPY src/ ./src/

RUN npm install 
RUN npm run build

CMD npm start