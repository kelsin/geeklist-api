const geeklists = require('./geeklists');
const logger = require('./logger');
const db = require('./db');

// Run DB Migrations
db.migrate.latest().then(data => {
  logger.info("DB at version " + data[0]);
  data[1].map(migration => logger.info("Ran migration: " + migration));
});

const INTERVAL = (process.env.UPDATE_INTERVAL_SECONDS || 60) * 1000;

const update = () => {
  logger.debug("Updating geeklists");
  return geeklists.updateGeeklists().reflect()
    .then(() => setTimeout(update, INTERVAL));
}

// Update initially
update();

logger.info("Worker thread started");
