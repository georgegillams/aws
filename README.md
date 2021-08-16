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
  - Redeploying individual projects - if a `build.zip` file has been pushed to a project, it will be extracted and replace the existing `build` directory within that project.

For a project to be deployed under the NEO system:

- A zip folder should be transferred to `/home/ubuntu/neo/` named `PROJECT-TIMESTAMP.zip`.
- The zip should contain a file `/config/aws/pm2Name` containing the PM2 instance name and nothing else.
- The zip should contain a setup script `/config/aws/setup.sh` if required.
- `setup.sh` should do anything that's needed to make the project work (install dependencies etc).

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
