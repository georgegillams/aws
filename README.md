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

  - is_default_site (optional, default false)
  - is_webapp
  - host_port (the port that's exposed to Nginx)
  - docker_port (the port of the app running inside docker)
  - server_name
  - redirect_to_www (required if webapp)

- The zip should contain a docker image in a file `docker-image.tar`, and the image should have the same name as the zip folder (`PROJECT_NAME---HASH`).

## Project ports

Projects should be configured to use the following ports:

| domain                                    | port | default site |
| ----------------------------------------- | ---- | ------------ |
| redis                                     | 6379 |              |
| georgegillams.co.uk                       | 3000 | true         |
| screen-reader-adventures.com              | 3001 |              |
| storybook.georgegillams.co.uk             | 3003 |              |
| webapp-boilerplate.georgegillams.co.uk    | 3004 |              |
| charlieandgeorge.uk                       | 3006 |              |
| cardchallenge.georgegillams.co.uk         | 3007 |              |
| sample-deployable-app.georgegillams.co.uk | 3010 |              |
