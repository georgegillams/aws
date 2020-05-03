sudo /usr/bin/certbot-auto certonly --nginx -d georgegillams.co.uk -d www.georgegillams.co.uk --debug
# TODO Add other projects SSL here...

sudo mkdir -p /etc/pki/nginx
sudo openssl dhparam -out /etc/pki/nginx/dhparams.pem 2048
