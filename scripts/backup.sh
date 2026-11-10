#!/usr/bin/env sh
set -e

mkdir -p backups
ARQUIVO="${1:-backups/backup_$(date +%Y%m%d_%H%M%S).sql}"

docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' > "$ARQUIVO"
echo "Backup salvo em: $ARQUIVO"
