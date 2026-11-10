#!/bin/sh
# Runs inside the pinned image: the visual check itself (the diagnostic copy of its
# spec against the committed references) for the "Two picked" story, both modes.
# check.sh <name> <count> ; DIAG, DIAG_CSS and DIAG_ALLOWANCE come from the environment.
name=$1; count=$2
i=1
while [ $i -le $count ]; do
  TOLERANCE_RUN="$name-$i" node node_modules/@playwright/test/cli.js test --config tolerance/check.config.ts --grep "Media picker sheet / Two picked" > "tolerance/logs/check-$name-$i.txt" 2>&1
  status=$?
  counted=$(grep -o "[0-9]* pixels (ratio" "tolerance/logs/check-$name-$i.txt" | head -1 | cut -d' ' -f1)
  echo "$name-$i exit $status $(grep -E '^ +[0-9]+ (passed|failed)' tolerance/logs/check-$name-$i.txt | tr -s ' ' | tr '\n' ' ') counted ${counted:-none}"
  i=$((i+1))
done
