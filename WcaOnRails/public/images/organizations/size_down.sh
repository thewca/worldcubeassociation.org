#!/usr/bin/env bash

# http://stackoverflow.com/a/3355423/1739415
cd "$(dirname "$0")"

MAX_WIDTH=500
MAX_HEIGHT=300
for f in *.{jpg,png,svg}; do
  width_height=(`identify -format "%[fx:w] %[fx:h]" $f`)
  width=${width_height[0]}
  height=${width_height[1]}

  if [ "$height" -gt "$MAX_HEIGHT" ] || [ "$width" -gt "$MAX_WIDTH" ]; then
    echo "Resizing $f down from ${width}x${height} to a maximum size of ${MAX_WIDTH}x${MAX_HEIGHT}"
    mogrify $f -resize ${MAX_WIDTH}x${MAX_HEIGHT}\> $f
  fi
done
