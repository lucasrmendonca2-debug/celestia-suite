// PM2 process config for Zenox bot on EC2 (Amazon Linux 2023).
// Used by: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "zenox-bot",
      cwd: "/home/ec2-user/zenox-bot",
      script: "dist/index.js",
      node_args: "--enable-source-maps",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "/home/ec2-user/zenox-bot/logs/out.log",
      error_file: "/home/ec2-user/zenox-bot/logs/err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
