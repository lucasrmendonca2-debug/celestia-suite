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

echo "==> Sincronizando bot/ para a raiz usada pelo PM2..."
cp -f bot/package.json bot/package-lock.json bot/bun.lock bot/tsconfig.json ./
[ -f bot/.env.example ] && cp -f bot/.env.example ./.env.example

for dir in src deploy assets; do
  rm -rf "$dir"
  cp -a "bot/$dir" "$dir"
done

mkdir -p logs

echo "==> Instalando dependências..."
npm install --include=dev

echo "==> Reiniciando bot..."
pm2 delete zenox-bot 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save

echo "==> Logs recentes:"
pm2 logs zenox-bot --lines 40 --nostream