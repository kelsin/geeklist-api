const bunyan = require('bunyan');

const logLevel = () => {
  if(process.env.NODE_ENV === 'development') {
    return 'debug';
  } else if(process.env.NO_LOGS) {
    return bunyan.FATAL + 1;
  } else {
    return 'info';
  }
}

const logger = bunyan.createLogger({
  name: 'geeklist-api',
  streams: [{
    level: logLevel(),
    stream: process.stdout
  }],
  serializers: bunyan.stdSerializers
});

module.exports = logger;
