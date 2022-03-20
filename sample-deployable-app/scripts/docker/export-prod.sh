#!/bin/bash

image_name=$1
if ! [ $image_name ]; then
  echo "Image name not supplied."
  echo "Image name should be provided as the first argument."
  exit 1
fi

# delete image if it already exists
if (docker images | grep $image_name > /dev/null); then
  docker image rm --force --no-prune $image_name
fi

# build new image
docker build -t $image_name -f Dockerfile .

# export image
docker save $image_name > docker-image.tar
