#!/bin/bash

set -e

if [ -f buildInProgress ]; then
  echo "Waiting for existing deploy to complete"
  exit 0
fi

newBuildPattern=*.zip
fileToDeploy=$(printf '%s\n' ${newBuildPattern} | head -n 1)
if [ "$fileToDeploy" = "" ] || [ "$fileToDeploy" = "$newBuildPattern" ]; then
  echo "No file to deploy"
  exit 0
fi

echo "Deploying ${fileToDeploy}"
extractedDir=$(echo "$fileToDeploy" | cut -f 1 -d '.')

# lock
echo "Preventing other builds"
touch ./buildInProgress
sleep 10 # wait to ensure the file transfer is complete

# unzip and delete
tmpDir=tmp_$extractedDir
echo "Creating temporary directory ${tmpDir}"
mkdir $tmpDir
echo "Extracting zip into temporary directory"
unzip $fileToDeploy -d $tmpDir
echo "Moving files out of temporary directory"
mv $tmpDir/* $extractedDir
echo "Files moved. Cleaning up zip and temporary directories"
rm -rf $tmpDir
rm -rf $fileToDeploy

# enter dir
echo "Entering new directory"
cd $extractedDir

# run config/aws/setup.sh
if [ -f config/aws/setup.sh ]; then
  echo "Running setup script"
  ./config/aws/setup.sh
else
  echo "No setup script to run"
fi

# create new ecosystem.config.js
if [ -f config/aws/pm2Name ] && [ -f config/aws/start_aws.sh ]; then
  echo "Configuring PM2"
  pm2Name=$(cat config/aws/pm2Name)

  echo "module.exports = {
    apps: [
      {
        name: '${pm2Name}',
        script: './config/aws/start_aws.sh',
        max_memory_restart: '15M',
        watch: ['build'],
        // Delay between restart
        watch_delay: 1000,
        ignore_watch: [],
        watch_options: {
          followSymlinks: false,
        },
      },
    ],
  };" > ecosystem.config.js

  # stop existing instance
  echo "Stopping old PM2 task (if exists)"
  pm2 delete $pm2Name | true

  # start new instance
  echo "Starting new PM2 task"
  pm2 start ./ecosystem.config.js

  # persist PM2 changes
  echo "Persisting pm2 changes"
  pm2 save

else
  echo "No pm2 name provided"
fi

# leave
echo "Leaving new directory"
cd ..

# cleanup old builds
dirBaseName=$(echo "$extractedDir" | cut -f 1 -d '-')-
echo "Cleaning up old directories matching ${dirBaseName}"
for x in ${dirBaseName}*; do
  if [ "$x" != "$extractedDir" ] && [ "$x" != "${dirBaseName}*" ]; then
    echo "Cleaning up old build $x"
    rm -rf $x
  fi
done

# unlock
sleep 5
echo "Completing deploy"
rm ./buildInProgress
