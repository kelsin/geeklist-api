const geeklists = require('./geeklists');
const logger = require('./logger');
const db = require('./db');

// Run DB Migrations
db.migrate.latest().then(data => {
  logger.info("DB at version " + data[0]);
  data[1].map(migration => logger.info("Ran migration: " + migration));
});

const INTERVAL = (process.env.UPDATE_INTERVAL_SECONDS || 5) * 1000;

const update = () => {
  logger.debug("Updating geeklists");
  return geeklists.updateGeeklists().reflect();
}

// Update initially and then start calling it based on the interval above
update().then(() => setInterval(update, INTERVAL));

logger.info("Worker thread started");
