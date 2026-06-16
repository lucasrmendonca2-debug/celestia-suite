# Deploy do Zenox Bot na EC2 (Amazon Linux 2023)

Instância alvo: `ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com`

> ⚠️ A chave `dadada.pem` foi exposta no chat. **Rotacione antes de ir pra produção** (criar nova key pair na AWS e substituir em `~/.ssh/authorized_keys` da instância, depois apagar a antiga no console EC2).

## 1. Security Group da EC2

Libere apenas:
- **SSH (22)** → seu IP
- **Saída (egress)** → tudo (o bot só faz conexões de saída pro Discord/Supabase, não precisa abrir porta de entrada além do SSH).

## 2. Da sua máquina — enviar código pra EC2

Da raiz do projeto Lovable, na sua máquina local:

```bash
chmod 400 dadada.pem

# enviar a pasta bot/ inteira (ignora node_modules, dist, .env)
rsync -avz --delete \
  --exclude node_modules --exclude dist --exclude .env --exclude logs \
  -e "ssh -i dadada.pem -o StrictHostKeyChecking=no" \
  bot/ ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com:/home/ec2-user/zenox-bot/
```

## 3. SSH na EC2 e setup inicial (roda 1x)

```bash
ssh -i dadada.pem ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com

# dentro da EC2:
bash ~/zenox-bot/deploy/setup.sh
cp ~/zenox-bot/.env.example ~/zenox-bot/.env
nano ~/zenox-bot/.env       # preencha DISCORD_TOKEN, CLIENT_ID, GUILD_ID, SUPABASE_*
bash ~/zenox-bot/deploy/start.sh
```

O último comando do `start.sh` imprime uma linha `sudo env PATH=... pm2 startup ...` — **copie e execute** essa linha para o pm2 subir o bot automaticamente após reboot. Depois rode `pm2 save` de novo.

## 4. Operação no dia-a-dia

```bash
pm2 status                  # ver se está online
pm2 logs zenox-bot          # ver logs em tempo real
pm2 restart zenox-bot       # reiniciar
pm2 stop zenox-bot          # parar
```

## 5. Deploy de atualização (depois de editar o código aqui)

Da sua máquina:

```bash
rsync -avz --delete \
  --exclude node_modules --exclude dist --exclude .env --exclude logs \
  -e "ssh -i dadada.pem" \
  bot/ ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com:/home/ec2-user/zenox-bot/

ssh -i dadada.pem ec2-user@ec2-52-67-80-142.sa-east-1.compute.amazonaws.com \
  "cd ~/zenox-bot && npm ci && npm run build && pm2 restart zenox-bot"
```

Pronto — bot rodando 24/7 com auto-restart e logs persistidos em `~/zenox-bot/logs/`.
