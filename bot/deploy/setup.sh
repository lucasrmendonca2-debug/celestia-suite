#!/usr/bin/env bash
# One-shot setup for Zenox bot on a fresh Amazon Linux 2023 EC2.
# Run as ec2-user:   bash setup.sh
set -euo pipefail

echo "==> Atualizando pacotes do sistema..."
sudo dnf update -y
sudo dnf install -y git tar gzip

echo "==> Instalando Node.js 20 (NodeSource)..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
  sudo dnf install -y nodejs
fi
node -v
npm -v

echo "==> Instalando pm2 global..."
sudo npm install -g pm2

mkdir -p "$HOME/zenox-bot/logs"
echo
echo "==> Setup base concluído."
echo "Agora envie o código do bot para: $HOME/zenox-bot"
echo "Depois rode:    bash $HOME/zenox-bot/deploy/start.sh"
