#!/bin/sh
set -eu
# Railway mounts volumes as root. Prepare only this application's directory,
# then drop privileges before migrations, HTTP service and background worker.
if [ "$(id -u)" = "0" ]; then
  install -d -m 700 -o node -g node /data/cost-observer
  exec gosu node "$0" "$@"
fi
node scripts/migrate.mjs
exec node scripts/start.mjs
