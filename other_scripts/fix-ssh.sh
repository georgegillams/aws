eval `ssh-agent -s`
# Note the lowercase `k` which is correct for Ubuntu
{ sleep .1; echo $SSH_PASSWORD; } | script -q /dev/null -c 'ssh-add -k ~/.ssh/id_rsa'
