#!/usr/bin/env bash
# Configure Supabase + Vercel for Uke Sensei via CLI.
# Prerequisites: logged in to Supabase and Vercel (yarn dlx installs supabase if needed).
#
# Usage:
#   yarn setup:cloud
#   SUPABASE_PROJECT_REF=xxx VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... yarn setup:cloud

set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source scripts/_supabase.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}→${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
fail()  { echo -e "${RED}✗${NC} $*"; exit 1; }

vercel_cmd() {
  if command -v vercel >/dev/null 2>&1; then
    vercel "$@"
  else
    yarn dlx vercel "$@"
  fi
}

command -v vercel >/dev/null 2>&1 || command -v yarn >/dev/null 2>&1 || fail "Need vercel CLI or yarn for yarn dlx vercel"

# Load .env if present
if [[ -f .env ]]; then
  info "Loading .env"
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
SUPABASE_URL="${VITE_SUPABASE_URL:-}"
SUPABASE_ANON="${VITE_SUPABASE_ANON_KEY:-}"

if [[ -z "$PROJECT_REF" && -n "$SUPABASE_URL" ]]; then
  PROJECT_REF=$(echo "$SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co|\1|p')
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo ""
  read -rp "Supabase project ref (from dashboard URL): " PROJECT_REF
fi

if [[ -z "$SUPABASE_URL" ]]; then
  SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
fi

if [[ -z "$SUPABASE_ANON" ]]; then
  echo ""
  read -rp "Supabase anon key: " SUPABASE_ANON
fi

if [[ ! -f supabase/config.toml ]]; then
  info "Initializing Supabase project config"
  supabase_cmd init
fi

info "Linking Supabase project ${PROJECT_REF}"
supabase_cmd link --project-ref "$PROJECT_REF"

info "Pushing database schema"
supabase_cmd db query --linked -f supabase/schema.sql
supabase_cmd db query --linked -f supabase/admin.sql

info "Setting Vercel environment variables"
printf '%s' "$SUPABASE_URL" | vercel_cmd env add VITE_SUPABASE_URL production --force
printf '%s' "$SUPABASE_ANON" | vercel_cmd env add VITE_SUPABASE_ANON_KEY production --force
printf '%s' "$SUPABASE_URL" | vercel_cmd env add VITE_SUPABASE_URL preview --force
printf '%s' "$SUPABASE_ANON" | vercel_cmd env add VITE_SUPABASE_ANON_KEY preview --force

info "Writing local .env"
cat > .env <<EOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON}
SUPABASE_PROJECT_REF=${PROJECT_REF}
EOF

echo ""
info "Done! Next steps:"
echo "  1. Enable Anonymous Sign-Ins in Supabase → Authentication → Providers"
echo "  2. Open the app, complete onboarding with your email"
echo "  3. Grant yourself admin: yarn admin:grant your@email.com"
echo "  4. Deploy: yarn dlx vercel --prod"
