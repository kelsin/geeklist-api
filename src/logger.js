const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'geeklist-api',
  streams: [{
    level: 'info',
    stream: process.stdout
  }],
  serializers: bunyan.stdSerializers
});

module.exports = logger;
