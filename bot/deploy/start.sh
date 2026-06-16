#!/usr/bin/env bash
# Instala deps, builda, registra comandos e sobe o bot via pm2.
# Pré-requisito: setup.sh já executado e arquivo .env preenchido na raiz do bot.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERRO: arquivo .env não encontrado em $(pwd)/.env"
  echo "Copie .env.example para .env e preencha os valores."
  exit 1
fi

echo "==> Instalando dependências..."
npm ci --omit=dev=false

echo "==> Build TypeScript..."
npm run build

echo "==> Registrando slash commands no Discord..."
npm run register || echo "(register falhou — ignore se já registrado)"

echo "==> Iniciando via pm2..."
pm2 start deploy/ecosystem.config.cjs
pm2 save

echo
echo "==> Configurando pm2 para subir no boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user | tail -n 5 || true
pm2 save

echo
echo "Bot rodando. Comandos úteis:"
echo "  pm2 status"
echo "  pm2 logs zenox-bot"
echo "  pm2 restart zenox-bot"
