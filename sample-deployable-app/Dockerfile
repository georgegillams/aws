FROM node:12

RUN mkdir /opt/app
WORKDIR /opt/app


# install system libraries
RUN apt update -y

COPY . .
RUN yarn install
EXPOSE 3000
CMD ["yarn", "start"]