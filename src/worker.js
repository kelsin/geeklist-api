const geeklists = require('./geeklists');
const logger = require('./logger');

const INTERVAL = 1 * 60 * 1000;

const update = () => {
  logger.info("Updating geeklists");
  return geeklists.updateGeeklists().relect();
}

// Update initially and then start calling it every minute
update().then(() => setInterval(update, INTERVAL));

logger.info("Worker thread started");
