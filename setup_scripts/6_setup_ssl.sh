sudo /usr/bin/certbot-auto certonly --nginx -d georgegillams.co.uk -d www.georgegillams.co.uk --debug
sudo /usr/bin/certbot-auto certonly --nginx -d screen-reader-adventures.com -d www.screen-reader-adventures.com --debug
sudo /usr/bin/certbot-auto certonly --nginx -d wedding.georgegillams.co.uk -d www.wedding.georgegillams.co.uk --debug
# TODO Add other projects SSL here...

sudo mkdir -p /etc/pki/nginx
sudo openssl dhparam -out /etc/pki/nginx/dhparams.pem 2048
