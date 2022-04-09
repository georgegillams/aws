sudo mkdir -p /var/www/html
sudo cp -R ./nginx/errors /var/www/html/

sudo cp ./nginx/nginx.conf /etc/nginx/nginx.conf
sudo rm /etc/nginx/sites-available/default || true
sudo rm /etc/nginx/sites-enabled/default || true

sudo service nginx restart
sudo update-rc.d nginx defaults

