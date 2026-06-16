# deploy-init.ps1 — Deploy inicial do Zenox bot na EC2 (Windows PowerShell).
# Coloque dadada.pem na mesma pasta deste script. Rode:  powershell -ExecutionPolicy Bypass -File deploy-init.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$KEY   = Join-Path $ScriptDir "dadada.pem"
$HOST_ = "ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com"

if (-not (Test-Path $KEY)) { throw "Chave nao encontrada em $KEY" }
if (-not (Test-Path "bot")) { throw "Pasta 'bot' nao encontrada em $ScriptDir" }

Write-Host "==> Ajustando permissao da chave..."
icacls $KEY /inheritance:r /grant:r "$($env:USERNAME):R" | Out-Null

Write-Host "==> Criando pasta destino na EC2..."
ssh -i $KEY -o StrictHostKeyChecking=no $HOST_ "mkdir -p ~/zenox-bot"

Write-Host "==> Enviando codigo (scp -r)..."
scp -i $KEY -r bot/* "${HOST_}:/home/ec2-user/zenox-bot/"

Write-Host "==> Instalando Node + pm2..."
ssh -i $KEY $HOST_ "bash ~/zenox-bot/deploy/setup.sh"

Write-Host "==> Criando .env (se nao existir)..."
ssh -i $KEY $HOST_ "cp -n ~/zenox-bot/.env.example ~/zenox-bot/.env"

Write-Host "==> Abrindo .env para voce colar os tokens (Ctrl+O Enter pra salvar, Ctrl+X pra sair)..."
ssh -i $KEY -t $HOST_ "nano ~/zenox-bot/.env"

Write-Host "==> Build + start com pm2..."
ssh -i $KEY $HOST_ "bash ~/zenox-bot/deploy/start.sh"

Write-Host ""
Write-Host "PRONTO. Logs:  ssh -i $KEY $HOST_ 'pm2 logs zenox-bot'"
