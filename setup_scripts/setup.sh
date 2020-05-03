# #!/bin/bash

(. ./setup_scripts/0_git_clone.sh)
(. ./setup_scripts/1_install.sh)
(. ./setup_scripts/2_configure_nginx.sh)
(. ./setup_scripts/3_configure_redis.sh)
(. ./setup_scripts/4_build_project.sh)
(. ./setup_scripts/5_setup_pm2.sh)
(. ./setup_scripts/6_setup_ssl.sh)
(. ./setup_scripts/7_configure_cron.sh)
