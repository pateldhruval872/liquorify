#!/bin/sh
# Runs inside the pinned image: captures the grep'd stories N times, one run per folder.
# loop.sh <prefix> <count> <grep> [extra playwright args]
prefix=$1; count=$2; grep=$3; shift 3
i=1
while [ $i -le $count ]; do
  TOLERANCE_RUN="$prefix-$i" node node_modules/@playwright/test/cli.js test --config ${CONFIG:-tolerance/capture.config.ts} --grep "$grep" "$@" > "tolerance/logs/$prefix-$i.txt" 2>&1
  echo "$prefix-$i exit $?"
  i=$((i+1))
done
