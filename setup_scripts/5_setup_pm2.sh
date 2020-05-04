pm2 startup | grep sudo | bash

cd /home/ubuntu/aws
pm2 start /home/ubuntu/aws/pm2_configs/redis/ecosystem.config.js
cd /home/ubuntu/georgegillams.co.uk
pm2 start /home/ubuntu/aws/pm2_configs/georgegillams.co.uk/ecosystem.config.js
# TODO Add other project pm2 scripts here

pm2 save

