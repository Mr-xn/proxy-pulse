FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p /data

ENV DATA_DIR=/data

VOLUME ["/data"]

EXPOSE 3456 1800 1801

CMD ["node", "app.js"]
