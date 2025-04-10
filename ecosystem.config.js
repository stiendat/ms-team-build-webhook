module.exports = {
    apps: [{
        name: "teams-webhook-app",
        script: "node_modules/next/dist/bin/next",
        args: "start",
        instances: 1,
        exec_mode: "fork",
        watch: false,
        merge_logs: true,
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        max_size: "10M",
        max_memory_restart: "500M",
        env: {
            NODE_ENV: "production"
        }
    }]
};