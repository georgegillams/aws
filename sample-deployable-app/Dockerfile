ARG NODE_VERSION=16.13.1-alpine
FROM node:${NODE_VERSION} AS base

ARG BUILT_AT

RUN mkdir /opt/app
WORKDIR /opt/app

COPY . .
RUN sed -i -e "s/BUILT_AT_PLACEHOLDER/$BUILT_AT/g" ./src/index.html
RUN yarn install

CMD ["yarn", "start"]