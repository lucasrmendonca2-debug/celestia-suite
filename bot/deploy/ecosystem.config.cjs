// PM2 config — roda direto com tsx (sem build), tolera erros de tipo.
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
