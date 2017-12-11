const geeklists = require('./geeklists');
const logger = require('./logger');

const INTERVAL = (process.env.UPDATE_INTERVAL_SECONDS || 5) * 1000;

const update = () => {
  logger.info("Updating geeklists");
  return geeklists.updateGeeklists().reflect();
}

// Update initially and then start calling it based on the interval above
update().then(() => setInterval(update, INTERVAL));

logger.info("Worker thread started");
