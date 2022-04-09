FROM ubuntu

ARG REDIS_PASSWORD

RUN mkdir /opt/app
WORKDIR /opt/app

# install system libraries
RUN apt update -y
RUN apt-get --yes --force-yes install redis

COPY . .
RUN sed -i -e "s/PASSWORD_PLACEHOLDER/$REDIS_PASSWORD/g" ./redis.conf
RUN cp ./redis.conf /etc/redis/redis.conf
RUN touch /etc/redis/redis_log
EXPOSE 6379
CMD ["redis-server", "/etc/redis/redis.conf"]