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
  return res.json({
    routes: {
      "/": "List of all groups that this api monitors",
      "/group/:group/": "List of all geeklists in a group",
      "/group/:group/user/:id": "Stats for an individual user",
      "/group/:group/user/:id/geeklist/:id": "Stats for an individual user, in a single geeklist",
      "/group/:group/geeklist/:id/": "Stats for an individual geeklist"
    },
    groups: []
  });
})

app.use(function(err, req, res, next) {
  logger.error(err);
  return res.status(500).json({
    error: true
  });
})

module.exports = app;
