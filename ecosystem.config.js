module.exports = {
  apps: [
    {
      name: 'nexusbank',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/www/wwwroot/nexusbankuk.com',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 5000,
      max_restarts: 50,
      min_uptime: '10s',
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Logging
      error_file: '/www/wwwroot/nexusbankuk.com/logs/pm2-error.log',
      out_file: '/www/wwwroot/nexusbankuk.com/logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful shutdown
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
};
