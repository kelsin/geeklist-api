module.exports = {
  apps: [{
    name: "worker",
    script: "./src/worker.js"
  },{
    name: "api",
    script: "./index.js",
    instances  : 4,
    exec_mode  : "cluster"
  }]
}
