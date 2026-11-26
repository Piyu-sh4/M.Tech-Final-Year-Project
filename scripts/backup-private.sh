#!/bin/sh
# Capture the application database, uploads and private keys at the same point.
# Use a private destination on encrypted storage outside the checkout.
set -eu
umask 077
cd "$(dirname "$0")/.."
destination=${1:?Specify a private backup directory outside this checkout}
mkdir -p "$destination"
destination=$(cd "$destination" && pwd -P)
case "$destination/" in "$(pwd -P)/"*) echo 'Choose a directory outside the checkout.' >&2; exit 1;; esac
backup=$(mktemp -d "$destination/workforce-XXXXXXXX")
# Pause only the application writer. MySQL remains online for a logical dump.
docker compose pause api >/dev/null
trap 'docker compose unpause api >/dev/null' EXIT
trap 'exit 1' INT HUP TERM
docker compose exec -T db sh -ec 'export MYSQL_PWD="$MYSQL_PASSWORD"; exec mysqldump -u "$MYSQL_USER" --single-transaction --no-tablespaces --routines --events --column-statistics=0 --set-gtid-purged=OFF "$MYSQL_DATABASE"' > "$backup/database.sql"
api=$(docker compose ps -q --all api)
docker cp "$api:/app/backend/uploads/." "$backup/uploads"
docker cp "$api:/app/backend/state/." "$backup/state"
if [ -f .env ]; then
  cp .env "$backup/compose.env"
  chmod 600 "$backup/compose.env"
fi
gzip "$backup/database.sql"
touch "$backup/COMPLETE"
printf '%s\n' "$backup"
