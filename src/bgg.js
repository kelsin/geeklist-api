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
const STARS_RE = /(:(half|no)?star:)+/;
const STAR_RE = /:star:/g;
const NOSTAR_RE = /:nostar:/g;
const HALFSTAR_RE = /:halfstar:/g;

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
    rating: getItemRating(item.body[0]) || getStarValue(item.body[0])
})

const getItemSummary = body => {
    const match = SUMMARY_RE.exec(body);
    if(match) {
        return match[1];
    }
}

const _countStars = (re, input) => (input.match(re) || []).length;
const countStars = R.curry(_countStars);
const getStarValue = body => {
    const match = STARS_RE.exec(body);
    if(match) {
        return normalizeRating((1.0 * countStars(STAR_RE, match[0])) +
                          (0.5 * countStars(HALFSTAR_RE, match[0])));
    }
}

const normalizeRating = R.compose(R.min(5.0), R.max(0.0), Number);

const getItemRating = body => {
    const match = RATING_RE.exec(body);
    if(match) {
        return normalizeRating(match[1]);
    }
}

module.exports = {
    SUMMARY_RE,
    RATING_RE,
    STARS_RE,
    STAR_RE,
    NOSTAR_RE,
    HALFSTAR_RE,
    BGG_URL,
    BGG_THREAD_PATH,
    getGeeklist,
    transformGeeklist,
    countStars,
    getStarValue,
    normalizeRating,
    getItemSummary,
    getItemRating
};
