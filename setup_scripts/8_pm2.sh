pm2 startup | grep sudo | bash

cd /home/ubuntu/aws
pm2 start /home/ubuntu/aws/pm2_configs/redis/ecosystem.config.js

cd /home/ubuntu/georgegillams.co.uk
pm2 start /home/ubuntu/aws/pm2_configs/georgegillams.co.uk/ecosystem.config.js

cd /home/ubuntu/screen-reader-adventures
pm2 start /home/ubuntu/aws/pm2_configs/screen-reader-adventures/ecosystem.config.js

cd /home/ubuntu/beta.cgwedding
pm2 start /home/ubuntu/aws/pm2_configs/beta.cgwedding/ecosystem.config.js

cd /home/ubuntu/gg-components
pm2 start /home/ubuntu/aws/pm2_configs/gg-components/ecosystem.config.js

cd /home/ubuntu/webapp-boilerplate
pm2 start /home/ubuntu/aws/pm2_configs/webapp-boilerplate/ecosystem.config.js

# TODO Add other project pm2 scripts here

pm2 save

# PM2 gotchas:
# - To pick up new environment variables, the process must be deleted and recreated.
# - If you manually stop a pm2 job, it will no longer be `watching` when you restart it.
# - If you delete the directory being watched, it will no longer be being watched. Therefore instead delete everything inside.

