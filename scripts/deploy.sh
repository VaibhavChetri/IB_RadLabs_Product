#!/usr/bin/env bash
set -euo pipefail

# Stage deploy: build → s3 sync → cloudfront invalidation
# Usage:  npm run deploy
# Override:  BUCKET=... DISTRIBUTION_ID=... REGION=... CF_PROFILE=... npm run deploy

BUCKET="${BUCKET:-ib-dashboard}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-E3TSV608ORV7JX}"
REGION="${REGION:-ap-south-1}"
# CloudFront requires a profile with cloudfront:* permissions; default IAM user lacks them
CF_PROFILE="${CF_PROFILE:-messenger}"

cyan='\033[36m'; green='\033[32m'; yellow='\033[33m'; reset='\033[0m'
log() { printf "${cyan}▸ %s${reset}\n" "$1"; }
ok()  { printf "${green}✓ %s${reset}\n" "$1"; }

# Show which branch is being deployed — user can abort if wrong
BRANCH=$(git rev-parse --abbrev-ref HEAD)
SHA=$(git rev-parse --short HEAD)
printf "${yellow}Deploying branch %s (%s) to s3://%s${reset}\n" "$BRANCH" "$SHA" "$BUCKET"

log "Building production bundle"
npm run build

log "Syncing dist/ → s3://$BUCKET ($REGION)"
aws s3 sync dist/ "s3://$BUCKET" --delete --region "$REGION"

log "Invalidating CloudFront $DISTRIBUTION_ID (profile: $CF_PROFILE)"
INVALIDATION_ID=$(AWS_PROFILE="$CF_PROFILE" aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text)

ok "Deployed. Invalidation: $INVALIDATION_ID (usually clears in 1–2 min)"
