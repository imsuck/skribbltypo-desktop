#!/usr/bin/env bash

DIR="src"
CMD="yarn start"
PID=""

start() {
  echo "Starting process..."
  $CMD &
  PID=$!
}

stop() {
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    echo "Stopping process $PID"
    kill "$PID"
    wait "$PID" 2>/dev/null
  fi
}

start

while inotifywait -r -e modify,create,delete,move "$DIR"; do
  echo "File changed, restarting..."
  stop
  start
done
