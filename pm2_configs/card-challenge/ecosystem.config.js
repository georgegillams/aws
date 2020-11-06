module.exports = {
  apps: [
    {
      name: "card-challenge",
      script: "./config/aws/start_aws.sh",
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
