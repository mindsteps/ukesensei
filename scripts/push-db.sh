#!/usr/bin/env bash
# Push schema changes to linked Supabase project.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source scripts/_supabase.sh

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "No linked Supabase project. Run: yarn setup:cloud"
  exit 1
fi

echo "Applying supabase/schema.sql..."
supabase_cmd db query --linked -f supabase/schema.sql
echo "Applying supabase/admin.sql..."
supabase_cmd db query --linked -f supabase/admin.sql
echo "Database schema applied."
