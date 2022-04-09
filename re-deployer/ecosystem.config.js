module.exports = {
  apps: [
    {
      name: "re-deployer",
      script: "./re-deployer/start.sh",
      watch: ["re-deployer/re-deployer.js"],
      // Delay between restart
      watch_delay: 1000,
    },
  ],
};
