FROM --platform=linux/amd64 node:16 AS builder

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY prisma ./prisma/
COPY .env ./

# Install app dependencies
RUN yarn

RUN yarn global add peer

COPY . .

RUN yarn run build

FROM --platform=linux/amd64 node:16

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 8002 8001 9000
# CMD [ "npx concurrently", "npx peerjs --port 9000 --key peerjs --path /", "yarn start:prod" ]
CMD [ "yarn", "start:prod" ]
