# aws

This is a collection of scripts and tools used to manage my AWS instance and the processes/sites I have running inside it

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
- Running regular cron tasks:
  - Renewing certificates.
- Redeploying projects

For a project to be deployed under the system:

- A zip folder should be transferred to `/home/ubuntu/neo/` named `PROJECT_NAME---HASH.zip`.
- The zip should contain a file `meta.json` containing the following:
  - is_default_site (optional, default false)
  - server_port
  - server_name
  - redirect_to_www
- The zip should contain a docker image in a file `docker-image.tar` with the same name as the zip folder.

## Project ports

Nginx will forward traffic for the follow apps to ports as follows:

| domain                                     | port |
| ------------------------------------------ | ---- |
| default_site                               | 3000 |
| www.georgegillams.co.uk                    | 3000 |
| georgegillams.co.uk                        | 3000 |
| www.screen-reader-adventures.com           | 3001 |
| screen-reader-adventures.com               | 3001 |
| storybook.georgegillams.co.uk              | 3003 |
| webapp-boilerplate.georgegillams.co.uk     | 3004 |
| www.webapp-boilerplate.georgegillams.co.uk | 3004 |
| charlieandgeorge.uk                        | 3006 |
| www.charlieandgeorge.uk                    | 3006 |
| cardchallenge.georgegillams.co.uk          | 3007 |
| www.cardchallenge.georgegillams.co.uk      | 3007 |
