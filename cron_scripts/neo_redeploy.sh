# #!/bin/bash

if [ -f buildInProgress ]; then
  echo "Waiting for existing deploy to complete"
  exit 0
fi

newBuildPattern="*.zip"
newBuildFiles=( $newBuildPattern )

fileToDeploy="${newBuildFiles[0]}"
if [ "$fileToDeploy" = "" ] || [ "$fileToDeploy" = "$newBuildPattern" ]; then
  echo "No file to deploy"
  exit 0
fi

extractedDir=$(echo "$fileToDeploy" | cut -f 1 -d '.')
echo "Deploying ${fileToDeploy}"

# lock
touch ./buildInProgress
sleep 5 # wait to ensure the file transfer is complete

# unzip and delete
unzip $fileToDeploy
rm -rf $fileToDeploy

# enter dir
cd $extractedDir

# run config/aws/setup.sh
./config/aws/setup.sh
./config/aws/redeploy.sh

# persist PM2 changes
pm2 save

# leave
cd ..

# unlock
sleep 5
echo "completing deploy"
rm ./buildInProgress
