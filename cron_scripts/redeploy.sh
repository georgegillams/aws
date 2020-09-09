# #!/bin/bash

if [ ! -f ../buildInProgress ]; then
  if [ -f build.zip ]; then
    touch ../buildInProgress
    sleep 5 # wait to ensure the file transfer is complete
    unzip build -d newBuild
    rm build.zip

    if [ -f newBuild/build/package.json ]; then
      echo "updating package files"
      mv newBuild/build/package.json ./
      mv newBuild/build/package-lock.json ./
    fi

    echo "updating dependencies"
    # TODO PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --only=prod
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci # TODO REMOVE

    echo "removing old build files"
    rm -rf build/*
    echo "installing new build"
    mv newBuild/build/* build/

    echo "setting write permissions on built files"
    chmod -R ugo+rw ./

    echo "cleaning up"
    rm -rf newBuild
    sleep 5
    echo "completing deploy"
    rm ../buildInProgress
  else
    echo "No new version to deploy"
  fi
else
  echo "Waiting for existing deploy to complete"
fi
