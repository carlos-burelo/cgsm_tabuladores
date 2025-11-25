module.exports = {
  apps: [
    {
      name: "tabuladores",
      script: "node_modules/.bin/next",
      args: "start -p 30001",
      cwd: "/apps/tabuladores",
      env: {
        NODE_ENV: "development",
        PORT: 30001
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 30001
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      error_file: "/apps/tabuladores/logs/err.log",
      out_file: "/apps/tabuladores/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
}
