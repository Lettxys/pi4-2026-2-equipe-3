#!/usr/bin/env sh
set -e

if [ -z "$1" ]; then
  echo "Uso: ./scripts/restore.sh <arquivo.sql>"
  exit 1
fi

docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' < "$1"
echo "Banco restaurado a partir de: $1"
