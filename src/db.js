const config = require('../knexfile.js')[process.env.NODE_ENV || 'development'];
const client = require('knex')(config);
module.exports = client;
