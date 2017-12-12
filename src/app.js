if (process.env.NEW_RELIC_LICENSE_KEY) {
    require('newrelic');
}

const bgg = require('./bgg');
const logger = require('./logger');

const groups = require('./groups');
const geeklists = require('./geeklists');
const stats = require('./stats');

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use(function(req, res, next) {
  res.set('Cache-Control', 'max-age=60');
  return next();
})

// Normal User Routes
app.get('/', groups.getGroups);
app.get('/group/:slug/', geeklists.getGeeklistsByGroupSlug);
app.get('/group/:slug/user/:username', stats.getUserStatsForGroup);

// Authentication
app.use('/admin', function(req, res, next) {
  res.set('Cache-Control', 'private, no-cache');

  let auth = req.get('Authorization');

  if(!process.env.AUTH_TOKEN) {
    return next("No Authorization Token Set");
  }

  if(!auth) {
    return next("No Authorization Header");
  }

  if(auth !== `token ${process.env.AUTH_TOKEN}`) {
    return next("Incorrect Authorization Token");
  }

  return next();
});

// Admin Group Routes
app.post('/admin/group', groups.postGroup);
app.delete('/admin/group/:slug', groups.deleteGroup);

// Admin Geeklist Routes
app.get('/admin/updating', geeklists.getUpdating);
app.post('/admin/update', geeklists.postUpdate);
app.post('/admin/group/:slug/geeklist', geeklists.postGeeklist);
app.delete('/admin/group/:slug/geeklist/:id', geeklists.deleteGeeklist);
app.get('/admin/bgg/geeklist/raw/:id', (req, res, next) => {
  bgg.getGeeklist(req.params.id)
    .then(res.json.bind(res))
    .catch(next);
})

app.get('/admin/bgg/geeklist/:id', (req, res, next) => {
  bgg.getGeeklist(req.params.id)
    .then(bgg.transformGeeklist)
    .then(res.json.bind(res))
    .catch(next);
})

// 404 Route
app.use((req, res, next) => res.status(404).json({ error: "Not Found" }));

// Error Route
app.use((error, req, res, next) => {
  logger.error(error);
  return res.status(500).json({ error });
});

module.exports = app;
