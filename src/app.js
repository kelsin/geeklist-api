if (process.env.NEW_RELIC_LICENSE_KEY) {
    require('newrelic');
}

const bgg = require('./bgg');
const logger = require('./logger');

const groups = require('./groups');

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use(function(req, res, next) {
  res.set('Cache-Control', 'max-age=300');
  return next();
})

app.get('/', function(req, res) {
  return groups.getGroups(req)
    .then(groups => {
      return res.json({
        routes: {
          "/": "List of all groups that this api monitors",
          "/group/:group/": "List of all geeklists in a group",
          "/group/:group/user/:id": "Stats for an individual user",
          "/group/:group/user/:id/geeklist/:id": "Stats for an individual user, in a single geeklist",
          "/group/:group/geeklist/:id/": "Stats for an individual geeklist"
        },
        groups
      });
    })
})

app.use('/admin', function(req, res, next) {
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

app.post('/admin/group', groups.addGroup);
app.delete('/admin/group/:id', groups.deleteGroup);

app.use(function(req, res, next) {
  return res.status(404).json({
    error: "Not Found"
  });
})

app.use(function(err, req, res, next) {
  logger.error(err);
  return res.status(500).json({
    error: err
  });
})

module.exports = app;
