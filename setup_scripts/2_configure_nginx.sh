sudo mkdir -p /var/www/html
sudo cp -R ./system_config/errors /var/www/html/

sudo cp ./system_config/nginx/nginx.conf /etc/nginx/nginx.conf
sudo rm /etc/nginx/sites-available/default
sudo cp ./system_config/nginx/sites-available/* /etc/nginx/sites-available/

sudo ln -s /etc/nginx/sites-available/georgegillams.co.uk /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/screen-reader-adventures.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/wedding.georgegillams.co.uk /etc/nginx/sites-enabled/
# TODO add other projects here...

sudo service nginx restart
sudo update-rc.d nginx defaults

