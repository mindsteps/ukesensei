#!/usr/bin/env bash
# Grant admin access to a user by email. Since sign-in is anonymous (no
# GitHub/email auth), this matches against the contact email collected
# during onboarding (profiles.contact_email), falling back to auth.users.email
# for any accounts that were linked to a real identity provider.
# Usage: ./scripts/grant-admin.sh user@example.com

set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source scripts/_supabase.sh

EMAIL="${1:-}"
if [[ -z "$EMAIL" ]]; then
  echo "Usage: yarn admin:grant <email>"
  exit 1
fi

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "No linked Supabase project. Run: yarn setup:cloud"
  exit 1
fi

# Escape single quotes in email for SQL literal
SAFE_EMAIL="${EMAIL//\'/\'\'}"

echo "Granting admin to ${EMAIL}..."
supabase_cmd db query --linked "UPDATE public.profiles p SET is_admin = true WHERE p.id = (
  SELECT p2.id FROM public.profiles p2
  LEFT JOIN auth.users u ON u.id = p2.id
  WHERE p2.contact_email = '${SAFE_EMAIL}' OR u.email = '${SAFE_EMAIL}'
  LIMIT 1
);"

echo "Done. Reload the app to see the Admin tab."
