module.exports = {
  apps: [
    {
      name: "card-challenge",
      script: "./config/aws/start_aws.sh",
      max_memory_restart: "15M",
      watch: ["build"],
      // Delay between restart
      watch_delay: 1000,
      ignore_watch: [],
      watch_options: {
        followSymlinks: false,
      },
    },
  ],
};
