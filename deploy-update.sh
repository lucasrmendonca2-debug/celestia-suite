#!/usr/bin/env bash
# Atualiza o bot na EC2. Rode da raiz do projeto Lovable: bash deploy-update.sh
set -euo pipefail

KEY="${ZENOX_KEY:-$HOME/Downloads/dadada.pem}"
HOST="${ZENOX_HOST:-ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com}"

echo "==> Enviando código para $HOST ..."
rsync -avz --delete \
  --exclude node_modules --exclude dist --exclude .env --exclude logs \
  -e "ssh -i $KEY -o StrictHostKeyChecking=no" \
  bot/ "$HOST:/home/ec2-user/zenox-bot/"

echo "==> Rebuild + restart na EC2 ..."
ssh -i "$KEY" "$HOST" "cd ~/zenox-bot && npm ci && npm run build && pm2 restart zenox-bot && pm2 status"

echo "==> OK. Logs em tempo real:  ssh -i $KEY $HOST 'pm2 logs zenox-bot'"
