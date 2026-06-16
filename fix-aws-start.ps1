# fix-aws-start.ps1 — Corrige o start na EC2 e inicia o Zenox sem build TypeScript.
# Rode em: C:\Users\Micro\Desktop\f

$ErrorActionPreference = "Stop"
$KEY   = "C:\Users\Micro\Desktop\f\dadada.pem"
$HOST_ = "ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com"

if (-not (Test-Path $KEY)) { throw "Chave nao encontrada em $KEY" }

Write-Host "==> Corrigindo deploy/start.sh direto na EC2..."
@'
#!/usr/bin/env bash
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
npx tsx src/scripts/registerCommands.ts || echo "register falhou; seguindo para ligar o bot"

echo "==> Reiniciando via pm2..."
pm2 delete zenox-bot 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save

echo "==> Configurando autostart no boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user | tail -n 5 || true
pm2 save

echo "Bot rodando."
'@ | ssh -i $KEY $HOST_ "cat > ~/zenox-bot/deploy/start.sh && chmod +x ~/zenox-bot/deploy/start.sh"

Write-Host "==> Corrigindo deploy/ecosystem.config.cjs direto na EC2..."
@'
module.exports = {
  apps: [
    {
      name: "zenox-bot",
      cwd: "/home/ec2-user/zenox-bot",
      script: "node_modules/.bin/tsx",
      args: "src/index.ts",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "500M",
      env: { NODE_ENV: "production" },
      out_file: "/home/ec2-user/zenox-bot/logs/out.log",
      error_file: "/home/ec2-user/zenox-bot/logs/err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
'@ | ssh -i $KEY $HOST_ "cat > ~/zenox-bot/deploy/ecosystem.config.cjs"

Write-Host "==> Criando src/bot/systems/logs/sender.ts direto na EC2..."
@'
import type { Guild, EmbedBuilder } from "discord.js";
import { GuildConfig } from "../../../database/models.js";

type ChannelKey =
  | "modLogChannelId"
  | "messageLogChannelId"
  | "memberLogChannelId"
  | "ticketLogChannelId";

/**
 * Envia um embed para o canal de log configurado no GuildConfig.
 * Falha silenciosamente se nao houver canal configurado / sem permissao.
 */
export async function sendLog(
  guild: Guild,
  channelKey: ChannelKey,
  embed: EmbedBuilder,
  _source?: string,
  _meta?: Record<string, unknown>,
): Promise<void> {
  try {
    const cfg = await GuildConfig.findOne({ guildId: guild.id }).lean();
    const channelId = cfg?.[channelKey] as string | null | undefined;
    if (!channelId) return;

    const channel =
      guild.channels.cache.get(channelId) ??
      (await guild.channels.fetch(channelId).catch(() => null));
    if (!channel || !channel.isTextBased()) return;

    await (channel as any).send({ embeds: [embed] }).catch(() => null);
  } catch {
    // log silencioso
  }
}
'@ | ssh -i $KEY $HOST_ "mkdir -p ~/zenox-bot/src/bot/systems/logs && cat > ~/zenox-bot/src/bot/systems/logs/sender.ts"

Write-Host "==> Iniciando bot..."
ssh -i $KEY $HOST_ "bash ~/zenox-bot/deploy/start.sh && pm2 status && pm2 logs zenox-bot --lines 50 --nostream"