# deploy-update.ps1 — Atualiza o bot na EC2 (Windows PowerShell).
# Rode depois de baixar mudancas do Lovable. Use:  powershell -ExecutionPolicy Bypass -File deploy-update.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$KEY   = Join-Path $ScriptDir "dadada.pem"
$HOST_ = "ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com"

Write-Host "==> Enviando codigo..."
ssh -i $KEY $HOST_ "mkdir -p ~/zenox-bot && rm -f ~/zenox-bot/dadada.pem"
scp -i $KEY -r bot/* "${HOST_}:/home/ec2-user/zenox-bot/"

Write-Host "==> Start/restart sem build TypeScript..."
ssh -i $KEY $HOST_ "bash ~/zenox-bot/deploy/start.sh && pm2 status && pm2 logs zenox-bot --lines 30 --nostream"

Write-Host ""
Write-Host "OK. Logs ao vivo:  ssh -i $KEY $HOST_ 'pm2 logs zenox-bot'"
