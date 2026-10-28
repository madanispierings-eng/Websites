#!/usr/bin/env bash
# Runs the migrations, seed and security checks in a throwaway database on a scratch Postgres server.
# Connection comes from the standard PG* variables, e.g. PGHOST=localhost PGPORT=5432 PGUSER=postgres.
# Never point this at a Supabase project: it installs a stub auth schema.
set -euo pipefail
cd "$(dirname "$0")/.."
db="medivo_test_$$"
psql -d postgres -qc "create database $db"
trap 'psql -d postgres -qc "drop database if exists $db with (force)"' EXIT
run() { psql -d "$db" -q -v ON_ERROR_STOP=1 -f "$1"; }
run supabase/tests/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do run "$f"; done
run supabase/seed.sql
run supabase/tests/10_security.sql
