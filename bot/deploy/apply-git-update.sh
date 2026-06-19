#!/usr/bin/env bash
# Atualiza a instalação EC2 quando o repositório completo foi clonado em ~/zenox-bot
# e o código real do bot fica dentro de ~/zenox-bot/bot/.
set -euo pipefail

ROOT="${1:-$HOME/zenox-bot}"
cd "$ROOT"

if [ ! -f bot/package.json ] || [ ! -d bot/src ]; then
  echo "ERRO: rode este script na raiz do clone que contém a pasta bot/."
  exit 1
fi

mkdir -p logs

get_env_value() {
  local key="$1"
  { grep -E "^${key}=" .env 2>/dev/null || true; } | tail -n1 | cut -d= -f2- | tr -d '"'"'"'"'"' \r'
}

is_missing_or_placeholder() {
  local value="${1:-}"
  [ -z "$value" ] && return 0
  [[ "$value" == COLE_* ]] && return 0
  [[ "$value" == *_AQUI ]] && return 0
  [[ "$value" == *"COLE_"* ]] && return 0
  return 1
}

# === Aviso no Discord (canal de deploy) ===
DEPLOY_CHANNEL_ID="801480652381356094"
DISCORD_TOKEN_VAL="$( { grep -E '^(DISCORD_TOKEN|DISCORD_BOT_TOKEN)=' .env 2>/dev/null || true; } | head -n1 | cut -d= -f2- | tr -d '"'"'"' \r')"
DISCORD_TOKEN_VAL="$(get_env_value DISCORD_TOKEN)"
[ -z "$DISCORD_TOKEN_VAL" ] && DISCORD_TOKEN_VAL="$(get_env_value DISCORD_BOT_TOKEN)"
DEPLOY_CHANNEL_ID="$(get_env_value DEPLOY_CHANNEL_ID)"
[ -z "$DEPLOY_CHANNEL_ID" ] && DEPLOY_CHANNEL_ID="801480652381356094"
COMMIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
COMMIT_MSG="$(git log -1 --pretty=%s 2>/dev/null || echo '?')"
notify_discord() {
  local content="$1"
  [ -z "$DISCORD_TOKEN_VAL" ] && return 0
  curl -s -o /dev/null -X POST \
    -H "Authorization: Bot $DISCORD_TOKEN_VAL" \
    -H "Content-Type: application/json" \
    -d "$(printf '{"content":%s}' "$(printf '%s' "$content" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')")" \
    "https://discord.com/api/v10/channels/$DEPLOY_CHANNEL_ID/messages" || true
}
notify_discord "🔄 Pegando commit \`$COMMIT_HASH\` — $COMMIT_MSG"


echo "==> Sincronizando bot/ para a raiz usada pelo PM2..."
cp -f bot/package.json bot/package-lock.json bot/bun.lock bot/tsconfig.json ./
[ -f bot/.env.example ] && cp -f bot/.env.example ./.env.example

for dir in src deploy assets; do
  rm -rf "$dir"
  cp -a "bot/$dir" "$dir"
done

mkdir -p logs

if grep -R "handleMessageXp" -n src/bot/events/messageCreate.ts src/bot/systems/social 2>/dev/null; then
  echo "ERRO: a cópia sincronizada ainda contém handleMessageXp. Abortando para evitar subir código antigo."
  exit 1
fi

echo "==> Instalando dependências..."
npm install --include=dev

echo "==> Reiniciando bot..."
pm2 delete zenox-bot 2>/dev/null || true
pm2 flush zenox-bot 2>/dev/null || true
: > logs/out.log
: > logs/err.log
pm2 start deploy/ecosystem.config.cjs
pm2 save

sleep 5

echo "==> Logs recentes:"
pm2 logs zenox-bot --lines 40 --nostream

notify_discord "✅ Deploy concluído — commit \`$COMMIT_HASH\` ativo."