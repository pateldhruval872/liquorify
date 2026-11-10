#!/bin/sh
# Runs inside the pinned image: the committed visual check, unchanged, N times.
# check-committed.sh <name> <count> <grep>
name=$1; count=$2; grep=$3
i=1
while [ $i -le $count ]; do
  node node_modules/@playwright/test/cli.js test --config visual/playwright.config.ts --reporter=line --output "tolerance/out/$name-$i" --grep "$grep" > "tolerance/logs/$name-$i.txt" 2>&1
  status=$?
  counted=$(grep -o "[0-9]* pixels (ratio" "tolerance/logs/$name-$i.txt" | head -1 | cut -d' ' -f1)
  echo "$name-$i exit $status $(grep -E '^ +[0-9]+ (passed|failed)' tolerance/logs/$name-$i.txt | tr -s ' ' | tr '\n' ' ') counted ${counted:-none}"
  i=$((i+1))
done
