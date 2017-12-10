const app = require('./src/app');
const logger = require('./src/logger');

app.listen(process.env.PORT || 3000, function() {
    logger.info('[%s] Listening on port %d...', app.settings.env, this.address().port);
});
