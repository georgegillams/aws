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
- Configuring nginx errors to be more useful than the default ones.
- Running the project re-deployer under pm2.
- Running docker projects under PM2.
- Running regular cron tasks:
  - Renewing certificates.

For a project to be deployed under the system:

- A zip folder should be transferred to `/home/ubuntu/departure-lounge/` named `PROJECT_NAME---HASH.zip`.
- The zip should contain a file `meta.json` containing the following:

  - is_webapp
  - docker_port (The port of the app running inside docker)
  - server_name
  - is_default_site [optional] (Default false)
  - host_port [optional] (The port that's exposed to Nginx. Defaults to auto-assigned port.)
  - redirect_to_www [optional] (Required if webapp. Default false.)

- The zip should contain a docker image in a file `docker-image.tar`, and the image should have the same name as the zip folder (`PROJECT_NAME---HASH`).

## Project ports

Projects will be assigned ports automatically, with the exception of the following:

| domain | port |
| ------ | ---- |
| redis  | 6379 |
