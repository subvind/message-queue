message-queue
========

## Project setup

```bash
# setup node.js project
$ npm install

# setup project dependencies
$ sudo pacman -S redis

$ systemctl start redis.service
$ systemctl enable redis.service
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
$ npm run test:consumer
$ npm run test:producer
$ npm run test:websocket-client
```
