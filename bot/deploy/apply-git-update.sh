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
  { grep -E "^${key}=" .env 2>/dev/null || true; } | tail -n1 | cut -d= -f2- | python3 -c 'import sys; print(sys.stdin.read().strip().strip("\""))'
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
  is_missing_or_placeholder "$DISCORD_TOKEN_VAL" && return 0
  curl -s -o /dev/null -X POST \
    -H "Authorization: Bot $DISCORD_TOKEN_VAL" \
    -H "Content-Type: application/json" \
    -d "$(printf '{"content":%s}' "$(printf '%s' "$content" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')")" \
    "https://discord.com/api/v10/channels/$DEPLOY_CHANNEL_ID/messages" || true
}

validate_env() {
  local errors=0
  if [ ! -f .env ]; then
    echo "ERRO: ~/zenox-bot/.env não existe. Crie o arquivo com os valores reais antes de reiniciar o bot."
    exit 1
  fi

  check_required() {
    local label="$1"
    local value="$2"
    if is_missing_or_placeholder "$value"; then
      echo "ERRO: $label está ausente ou ainda está com placeholder COLE_..._AQUI no .env."
      errors=1
    fi
  }

  check_required "DISCORD_TOKEN ou DISCORD_BOT_TOKEN" "$DISCORD_TOKEN_VAL"
  check_required "DISCORD_CLIENT_ID" "$(get_env_value DISCORD_CLIENT_ID)"
  check_required "MONGO_URI" "$(get_env_value MONGO_URI)"

  # SUPABASE_SERVICE_ROLE_KEY é opcional, mas tickets/dashboard precisam de
  # SUPABASE_URL + SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY para ler configs.
  if is_missing_or_placeholder "$(get_env_value SUPABASE_URL)"; then
    echo "AVISO: SUPABASE_URL ausente/placeholder — tickets/dashboard podem ficar desativados no bot."
  fi
  local public_key="$(get_env_value SUPABASE_ANON_KEY)"
  [ -z "$public_key" ] && public_key="$(get_env_value SUPABASE_PUBLISHABLE_KEY)"
  if is_missing_or_placeholder "$public_key"; then
    echo "AVISO: SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY ausente — o bot não consegue ler as configs do dashboard."
  fi
  for opt in SUPABASE_SERVICE_ROLE_KEY; do
    if is_missing_or_placeholder "$(get_env_value "$opt")"; then
      echo "AVISO: $opt ausente/placeholder — o bot usará a chave pública e seguirá com fallbacks nos tickets."
    fi
  done

  if [ "$errors" -ne 0 ]; then
    echo "ERRO: deploy abortado para não subir o bot bugado com .env inválido."
    echo "Dica: não use os textos COLE_..._AQUI; substitua pelos valores reais e rode este script de novo."
    exit 1
  fi
}

validate_env
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