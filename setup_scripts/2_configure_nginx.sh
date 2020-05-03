sudo mkdir -p /var/www/html
sudo cp -R ./system_config/errors /var/www/html/

sudo cp ./system_config/nginx.conf /etc/nginx/nginx.conf
sudo service nginx restart
sudo update-rc.d nginx defaults

