FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install && apk add --no-cache postgresql-client
COPY . .
EXPOSE 4001
CMD ["node", "server.js"]
