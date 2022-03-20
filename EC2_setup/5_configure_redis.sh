sudo cp ./redis/redis.conf /etc/redis/redis.conf
sudo touch /etc/redis/redis_log
sudo chown -R ubuntu /etc/redis
sudo pkill redis-server
