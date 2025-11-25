const path = require("path")

module.exports = {
  apps: [
    {
      name: "tabuladores",
      script: path.join(__dirname, ".next/standalone/server.js"),
      cwd: "/apps/tabuladores",
      args: "",
      env: {
        NODE_ENV: "development",
        PORT: 3001
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001
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
