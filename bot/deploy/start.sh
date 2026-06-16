#!/usr/bin/env bash
# Instala deps e sobe o bot via pm2 usando tsx (sem build TS).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERRO: .env nao encontrado em $(pwd)"
  exit 1
fi

mkdir -p logs

echo "==> Instalando dependencias (incluindo tsx)..."
npm install --include=dev

echo "==> Registrando slash commands no Discord..."
npx tsx src/scripts/registerCommands.ts || echo "(register falhou — ignore se ja registrado)"

echo "==> (Re)iniciando via pm2..."
pm2 delete zenox-bot 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save

echo "==> Configurando autostart no boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user | tail -n 5 || true
pm2 save

echo ""
echo "Bot rodando. Comandos:"
echo "  pm2 status"
echo "  pm2 logs zenox-bot"
