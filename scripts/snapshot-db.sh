#!/bin/sh
set -eu

cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
snapshot_dir=$(mktemp -d database/.snapshot.XXXXXX)
seed_project="wfi-seed-$(basename "$snapshot_dir" | tr '[:upper:].' '[:lower:]-')"
seed_compose() { docker compose -f compose.seed.yml -p "$seed_project" "$@"; }
cleanup() {
  seed_compose down -v >/dev/null
  rm -rf "$snapshot_dir"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
seed_compose up -d --wait db
seed_compose run --build --rm seed

# This source has no live mounts, credentials, or published ports.
seed_compose exec -T db sh -eu <<'DUMP' > "$snapshot_dir/snapshot.sql"
export MYSQL_PWD="$MYSQL_PASSWORD"

# A snapshot must include the bootstrap marker and completed demo migrations.
mysql --user="$MYSQL_USER" "$MYSQL_DATABASE" --batch --skip-column-names \
  --execute='SELECT id FROM wfi_bootstrap; SELECT version FROM demo_migrations' > /dev/null

# The seed container's private encryption key is disposable. Export generated
# fixture identifiers for these two fields; first boot encrypts them locally.
mysql --user="$MYSQL_USER" "$MYSQL_DATABASE" <<'SQL'
UPDATE employee_banking SET account_number=CONCAT('99000000',LPAD(user_id,8,'0'));
UPDATE users SET account_number=CONCAT('99000000',LPAD(user_id,8,'0')) WHERE account_number IS NOT NULL;
DELETE FROM demo_migrations WHERE version='2026-11-banking-encryption-v10';
SQL

dump() {
  mysqldump --user="$MYSQL_USER" --single-transaction --no-tablespaces \
    --set-gtid-purged=OFF --column-statistics=0 --default-character-set=utf8mb4 \
    --hex-blob --order-by-primary --skip-comments --skip-dump-date --skip-add-locks "$@"
}

# Retain these tables' schemas, with empty credentials and browser registrations.
dump --no-data "$MYSQL_DATABASE" \
  chat_providers chat_provider_selection login_sessions user_sessions pwa_push_subscriptions passkey_credentials passkey_challenges attendance_proofs payslip_downloads user_location_prefs attendance_security_audit audit_logs build_requests build_request_events

# One consistent transaction captures all remaining application records.
dump --routines --events \
  --ignore-table="$MYSQL_DATABASE.chat_providers" \
  --ignore-table="$MYSQL_DATABASE.chat_provider_selection" \
  --ignore-table="$MYSQL_DATABASE.login_sessions" \
  --ignore-table="$MYSQL_DATABASE.user_sessions" \
  --ignore-table="$MYSQL_DATABASE.pwa_push_subscriptions" \
  --ignore-table="$MYSQL_DATABASE.passkey_credentials" \
  --ignore-table="$MYSQL_DATABASE.passkey_challenges" \
  --ignore-table="$MYSQL_DATABASE.attendance_proofs" \
  --ignore-table="$MYSQL_DATABASE.payslip_downloads" \
  --ignore-table="$MYSQL_DATABASE.attendance_security_audit" \
  --ignore-table="$MYSQL_DATABASE.build_requests" \
  --ignore-table="$MYSQL_DATABASE.build_request_events" \
  --ignore-table="$MYSQL_DATABASE.audit_logs" \
  --ignore-table="$MYSQL_DATABASE.user_location_prefs" \
  "$MYSQL_DATABASE"
DUMP

# Replace the committed snapshot only after both dumps and compression succeed.
gzip -n -c "$snapshot_dir/snapshot.sql" > "$snapshot_dir/snapshot.sql.gz"
gzip -t "$snapshot_dir/snapshot.sql.gz"
mv "$snapshot_dir/snapshot.sql.gz" database/snapshot.sql.gz
printf '%s\n' 'Saved database/snapshot.sql.gz. Existing database volumes are unchanged.'
