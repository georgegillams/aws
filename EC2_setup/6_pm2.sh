pm2 startup | grep sudo | bash

cd /home/ubuntu/aws
pm2 start /home/ubuntu/aws/redis/ecosystem.config.js

cd /home/ubuntu/aws
pm2 start /home/ubuntu/aws/re-deployer/ecosystem.config.js

pm2 save

# PM2 gotchas:
# - To pick up new environment variables, the process must be deleted and recreated.
# - If you manually stop a pm2 job, it will no longer be `watching` when you restart it.
# - If you delete the directory being watched, it will no longer be being watched. Therefore instead delete everything inside.

