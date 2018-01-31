module.exports = {
  apps: [{
    name: "worker",
    script: "./src/worker.js"
  },{
    name: "api",
    script: "./index.js",
    instances  : 2,
    exec_mode  : "cluster"
  }]
}
