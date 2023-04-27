FROM node

WORKDIR /abhinav/src/app

COPY package*.json ./

RUN yarn

RUN npx prisma generate

RUN yarn global add peer

COPY . .

RUN yarn build

EXPOSE 8002 8001 9000

CMD []