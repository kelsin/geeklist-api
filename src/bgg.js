const logger = require('./logger');
const request = require('request-promise');
const parse = require('./xml').parse;

const BGG_URL = 'https://www.boardgamegeek.com/';
const BGG_XMLAPI_GEEKLIST_PATH = 'xmlapi/geeklist/';
const BGG_THREAD_PATH = 'thread/';

const geeklistUrl = id => `${BGG_URL}${BGG_XMLAPI_GEEKLIST_PATH}${id}`;

const getGeeklist = id =>
      request(geeklistUrl(id))
      .then(parse);

module.exports = { BGG_URL, BGG_THREAD_PATH, getGeeklist };
