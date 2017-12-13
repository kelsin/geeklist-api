const bunyan = require('bunyan');
const R = require('ramda');

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
module.exports.tap = R.tap(logger.debug.bind(logger));
