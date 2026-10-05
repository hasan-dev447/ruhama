#!/usr/bin/env bash
# Development only: drop and recreate the local database schema.
set -euo pipefail
psql "${DATABASE_URL_DIRECT:-$DATABASE_URL}" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
