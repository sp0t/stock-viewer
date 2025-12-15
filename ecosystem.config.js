// PM2 Ecosystem Configuration
// Run with: pm2 start ecosystem.config.js

export default {
  apps: [{
    name: 'stock-viewer-backend',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};



