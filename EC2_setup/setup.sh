# #!/bin/bash

(. ./EC2_setup/1_dns.sh)
(. ./EC2_setup/2_deploy_location.sh)
(. ./EC2_setup/3_install.sh)
(. ./EC2_setup/4_configure_nginx.sh)
(. ./EC2_setup/5_configure_redis.sh)
(. ./EC2_setup/6_pm2.sh)
(. ./EC2_setup/7_ssl.sh)
(. ./EC2_setup/8_nginx_ssl.sh)
(. ./EC2_setup/9_configure_cron.sh)