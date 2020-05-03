# aws

This is a collection of scripts and tools used to manage my AWS instance.

## Setup

Setup should be run from within `/home/ubuntu/aws`.

```
cd /home/ubuntu/aws
. ./setup_scripts/setup.sh
```

## Responsibility boundaries

These scripts are responsible for
 - Getting certificates for each site.
 - Configuring nginx to direct requests to running servers.
 - Configuring nginx errors to be slightly more exciting/useful than the default ones.
 - Running redis under pm2.
 - Running servers under pm2. The pm2 jobs will run scripts within each repo. The repos themselves are responsible for deciding what should be inside the scripts.
 - Running regular cron tasks:
   - Renewing certificates.
   - Redeploying individual projects - if a `build.zip` file has been pushed to a project, it will be extracted and replace the existing `build` directory within that project.
 - 
