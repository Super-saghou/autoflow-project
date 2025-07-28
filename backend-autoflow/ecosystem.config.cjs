module.exports = {
  apps: [
    {
      name: "backend",
      script: "server.js",
      interpreter: "node"
    },
    {
      name: "playbook_api",
      script: "playbook_api.py",
      interpreter: "python3"
    }
  ]
}; 