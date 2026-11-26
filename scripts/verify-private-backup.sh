#!/bin/sh
# Restore into new, unexposed Compose volumes, verify health and compare file contents.
set -eu
umask 077
cd "$(dirname "$0")/.."
backup=$(cd "${1:?Provide a completed private backup directory}" && pwd -P)
test -f "$backup/COMPLETE"
temporary=$(mktemp -d)
project="wfi-restore-$(basename "$temporary" | tr '[:upper:].' '[:lower:]-')"
export WFI_RESTORE_BACKUP="$backup"
cat > "$temporary/compose.yml" <<'YAML'
services:
  db:
    volumes:
      - ${WFI_RESTORE_BACKUP}/database.sql.gz:/docker-entrypoint-initdb.d/02_snapshot.sql.gz:ro
  api:
    ports: !reset []
YAML
environment="$backup/compose.env"
[ -f "$environment" ] || environment=.env.compose.example
restore() { docker compose --env-file "$environment" -p "$project" -f docker-compose.yml -f "$temporary/compose.yml" "$@"; }
cleanup() { restore down -v >/dev/null; rm -rf "$temporary"; }
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
restore up -d --wait db redis
restore create --build api
container=$(restore ps -aq api)
for folder in uploads state; do docker cp "$backup/$folder/." "$container:/app/backend/$folder/"; done
restore run --rm --no-deps -T --user root --entrypoint sh api -c 'chown -R node:node /app/backend/uploads /app/backend/state'
restore up -d --wait
for folder in uploads state; do
  (cd "$backup/$folder" && find . -type f -exec shasum -a 256 {} +) > "$temporary/checksums"
  if [ -s "$temporary/checksums" ]; then
    restore exec -T api sh -c "cd /app/backend/$folder && sha256sum -c -s" < "$temporary/checksums"
  fi
done
restore exec -T db sh -ec 'export MYSQL_PWD="$MYSQL_PASSWORD"; mysql -u "$MYSQL_USER" "$MYSQL_DATABASE" -e "SELECT COUNT(*) AS employees FROM users; SELECT COUNT(*) AS payroll_records FROM salary_records; SELECT COUNT(*) AS payroll_items FROM salary_line_items"'
echo 'Private backup restored. API healthy and all backed-up files match.'
