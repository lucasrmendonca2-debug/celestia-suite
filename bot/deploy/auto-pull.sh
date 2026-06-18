#!/usr/bin/env bash
# Verifica o GitHub e, se houver commit novo na branch atual, roda o deploy.
# Pensado para rodar via cron a cada minuto.
set -euo pipefail

ROOT="${1:-$HOME/zenox-bot}"
cd "$ROOT"

# Lock pra não rodar dois deploys ao mesmo tempo
LOCK="/tmp/zenox-auto-pull.lock"
exec 9>"$LOCK"
flock -n 9 || exit 0

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git fetch --quiet origin "$BRANCH"

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "[$(date -Is)] novo commit detectado: $LOCAL -> $REMOTE" >> "$HOME/zenox-bot/logs/auto-pull.log"
git pull --ff-only origin "$BRANCH" >> "$HOME/zenox-bot/logs/auto-pull.log" 2>&1
bash bot/deploy/apply-git-update.sh >> "$HOME/zenox-bot/logs/auto-pull.log" 2>&1

# auto-update test 2026-06-18T23:50:00Z
