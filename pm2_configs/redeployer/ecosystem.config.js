module.exports = {
  apps: [
    {
      name: "redeployer",
      script: "./system_config/start_redeployer.sh",
      max_memory_restart: "150M",
    },
  ],
};
