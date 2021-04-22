FROM node

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . .

RUN npm run db:setup

CMD npm run start:dev