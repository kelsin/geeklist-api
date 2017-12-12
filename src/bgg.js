const logger = require('./logger');
const moment = require('moment');
const R = require('ramda');
const request = require('request-promise');
const parse = require('./xml').parse;

const BGG_URL = 'https://www.boardgamegeek.com/';
const BGG_XMLAPI_GEEKLIST_PATH = 'xmlapi/geeklist/';
const BGG_THREAD_PATH = 'thread/';

const SUMMARY_RE = /\<summary\>(.+)\<\/summary\>/;
const RATING_RE = /\<rating\>([0-9.]+)\<\/rating\>/;

const geeklistUrl = id => `${BGG_URL}${BGG_XMLAPI_GEEKLIST_PATH}${id}`;

const getGeeklist = id =>
      request(geeklistUrl(id))
      .then(parse)
      .then(response => {
          if(response.message) {
              throw new Error(response.message);
          }
          return response;
      });

const transformGeeklist = response => ({
    id: response.geeklist.$.id,
    title: response.geeklist.title[0],
    postdate: moment(response.geeklist.postdate[0]).utc(),
    editdate: moment(response.geeklist.editdate[0]).utc(),
    thumbs: response.geeklist.thumbs[0],
    numitems: response.geeklist.numitems[0],
    username: response.geeklist.username[0],
    items: R.map(transformItem, response.geeklist.item)
});

const transformItem = item => ({
    id: item.$.id,
    username: item.$.username,
    objecttype: item.$.objecttype,
    subtype: item.$.subtype,
    objectid: item.$.objectid,
    objectname: item.$.objectname,
    postdate: moment(item.$.postdate).utc(),
    editdate: moment(item.$.editdate).utc(),
    thumbs: item.$.thumbs,
    imageid: item.$.imageid,
    summary: getItemSummary(item.body[0]),
    rating: getItemRating(item.body[0])
})

const getItemSummary = body => {
    const match = SUMMARY_RE.exec(body);
    if(match) {
        return match[1];
    }
}
const getItemRating = body => {
    const match = RATING_RE.exec(body);
    if(match) {
        return Number(match[1]);
    }
}

module.exports = {
    BGG_URL,
    BGG_THREAD_PATH,
    getGeeklist,
    transformGeeklist,
    getItemSummary,
    getItemRating
};
