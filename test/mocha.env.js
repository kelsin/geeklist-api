const db = require('../src/db');

process.env.NO_LOGS = true;

after(function() {
  db.destroy();
})
