// PM2 生产环境进程管理配置
module.exports = {
  apps: [
    {
      name: 'softbuluo-server',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'server/src/index.ts',
      instances: 'max', // 集群模式，充分利用多核 CPU
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: 'logs/pm2-err.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};
