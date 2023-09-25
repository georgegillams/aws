# NVM:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install 17.8.0

# Just incase dpkg was previously interrupted
sudo dpkg --configure -a

sudo apt-get update --yes
sudo apt-get --yes --force-yes install nginx
sudo apt-get --yes --force-yes install zip
sudo apt-get --yes --force-yes install unzip

# GUI:
# From https://www.australtech.net/how-to-enable-gui-on-aws-ec2-ubuntu-server/
sudo apt-get --yes --force-yes install lxde
sudo apt-get --yes --force-yes install xrdp
sudo passwd $USER
sudo systemctl enable xrdp

# Docker:
# From https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-20-04
sudo apt-get update --yes
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "https://download.docker.com/linux/ubuntu focal stable"
apt-cache policy docker-ce
sudo apt install docker-ce
sudo usermod -aG docker ${USER}
# Reboot now required

npm install pm2 -g

# Lazydocker
curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh | bash

# Certbot
# From https://www.ubuntupit.com/how-to-install-and-setup-lets-encrypt-certbot-on-linux/
sudo apt update
sudo apt install snapd
sudo snap install core
sudo snap refresh core
sudo snap install snap-store
sudo snap install --classic certbot
sudo certbot --nginx

sudo cp ./sudoers.d/$USER /etc/sudoers.d/$USER
sudo chmod 0440 /etc/sudoers.d/$USER
sudo chmod -R 777 /etc/nginx
sudo chmod -R 777 /etc/letsencrypt
