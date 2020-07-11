eval `ssh-agent -s`
# Note the lowercase `k` which is correct for Ubuntu
ssh-add -k ~/.ssh/id_rsa
