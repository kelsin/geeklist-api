if (process.env.NEW_RELIC_LICENSE_KEY) {
    require('newrelic');
}

const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors());

app.get('/', function(req, res) {
  return res.json({ test: true });
})

module.exports = app;
