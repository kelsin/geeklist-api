const request = require('request-promise');
const parse = require('./xml').parse;

const BGG_URL = 'https://www.boardgamegeek.com/';
const BGG_GEEKLIST_URL = 'xmlapi/geeklist/';

function geeklistUrl(id) {
  return `${BGG_URL}${BGG_GEEKLIST_URL}${id}`;
}

function getGeeklist(id) {
  return request(geeklistUrl(id))
    .then(parse);
}

module.exports = { getGeeklist };
