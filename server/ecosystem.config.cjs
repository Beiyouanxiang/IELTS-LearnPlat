// PM2 配置：与服务器上的 Bookmark-Page(3000) / Exam199-Study(3005) 共存
// 端口固定 3007。PM2 必须在 server/ 目录下 reload，否则会报找不到文件。
module.exports = {
  apps: [
    {
      name: 'ielts-workbench',
      cwd: __dirname,
      script: 'src/index.js',
      instances: 1,
      // SQLite(WAL) 是单写者模型，用 fork 单进程最稳，不要用 cluster
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
        DB_PATH: './data/ielts.db',
        UPLOAD_DIR: './uploads',
      },
      max_memory_restart: '400M',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
      autorestart: true,
    },
  ],
};
