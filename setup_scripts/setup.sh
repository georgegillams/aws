#!/bin/bash

(. ./setup_scripts/1_dns.sh)
(. ./setup_scripts/2_bashrc.sh)
(. ./setup_scripts/3_git_clone.sh)
(. ./setup_scripts/4_install.sh)
(. ./setup_scripts/5_configure_nginx.sh)
(. ./setup_scripts/6_configure_redis.sh)
(. ./setup_scripts/7_install_project_dependencies.sh)
(. ./setup_scripts/8_pm2.sh)
(. ./setup_scripts/9_ssl.sh)
(. ./setup_scripts/10_nginx_ssl.sh)
(. ./setup_scripts/11_configure_cron.sh)
