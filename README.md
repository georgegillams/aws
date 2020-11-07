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
