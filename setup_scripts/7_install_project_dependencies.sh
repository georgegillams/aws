cd /home/ubuntu/georgegillams.co.uk
# TODO PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --only=prod
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci # TODO REMOVE
mkdir build

cd /home/ubuntu/screen-reader-adventures
# TODO PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --only=prod
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci # TODO REMOVE
mkdir build

cd /home/ubuntu/beta.cgwedding
# TODO PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --only=prod
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci # TODO REMOVE
mkdir build

cd /home/ubuntu/gg-components
# TODO PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --only=prod
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci # TODO REMOVE
mkdir build

cd /home/ubuntu/webapp-boilerplate
# TODO PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --only=prod
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci # TODO REMOVE
mkdir build

cd /home/ubuntu/card-challenge
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --only=prod
mkdir build

# TODO Add other project redeploys here
