const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'geeklist-api',
  streams: [{
    level: process.env.NO_LOGS ? (bunyan.FATAL + 1) : 'info',
    stream: process.stdout
  }],
  serializers: bunyan.stdSerializers
});

module.exports = logger;
