# deploy-update.ps1 — Atualiza o bot na EC2 (Windows PowerShell).
# Rode depois de baixar mudancas do Lovable. Use:  powershell -ExecutionPolicy Bypass -File deploy-update.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$KEY   = Join-Path $ScriptDir "dadada.pem"
$HOST_ = "ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com"

Write-Host "==> Enviando codigo..."
scp -i $KEY -r bot/* "${HOST_}:/home/ec2-user/zenox-bot/"

Write-Host "==> Rebuild + restart..."
ssh -i $KEY $HOST_ "cd ~/zenox-bot && npm ci && npm run build && pm2 restart zenox-bot && pm2 status"

Write-Host ""
Write-Host "OK. Logs ao vivo:  ssh -i $KEY $HOST_ 'pm2 logs zenox-bot'"
