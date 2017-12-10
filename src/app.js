if (process.env.NEW_RELIC_LICENSE_KEY) {
    require('newrelic');
}

const bgg = require('./bgg');
const logger = require('./logger');

const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors());

app.use(function(req, res, next) {
  res.set('Cache-Control', 'max-age=300');
  return next();
})

app.get('/', function(req, res) {
  return res.json({ test: true });
})

app.get('/:id', function(req, res, next) {
  return bgg.getGeeklist(req.params.id)
    .then(result => res.json(result))
    .catch(next);
})

app.use(function(err, req, res, next) {
  logger.error(err);
  return res.status(500).json({
    error: true
  });
})

module.exports = app;
