#!/usr/bin/env bash
# Resolve supabase CLI: global install, or yarn dlx fallback.
supabase_cmd() {
  if command -v supabase >/dev/null 2>&1; then
    supabase "$@"
  else
    yarn dlx supabase "$@"
  fi
}
