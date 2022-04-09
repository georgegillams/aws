#!/bin/bash

image_name=$1
if ! [ $image_name ]; then
  echo "Image name not supplied."
  echo "Image name should be provided as the first argument."
  exit 1
fi

declare -a expected_args=("BUILT_AT")
for i in "${expected_args[@]}"
do
  arg_value="$(printenv $i)"
  if ! [ "$arg_value" ]; then
    echo "$i was not supplied."
    echo "$i environment variable should be set."
    exit 1
  fi
done

# delete image if it already exists
if (docker images | grep $image_name > /dev/null); then
  docker image rm --force --no-prune $image_name
fi

# build new image
docker buildx build \
  --build-arg BUILT_AT="$BUILT_AT" \
  --platform linux/arm64 -t $image_name -f Dockerfile .

# export image
docker save $image_name > docker-image.tar
