const db = require('./db');
const moment = require('moment');
const Promise = require('bluebird');
const R = require('ramda');

// getNewUpdateTime :: Number -> Moment -> Moment
const _getNewUpdateTime = (minimumUpdateSeconds, now, randomSeconds, lastUpdated) => {
  let newUpdateSeconds = now.diff(lastUpdated) / 4000;
  return now.add(Math.max(minimumUpdateSeconds,
                     newUpdateSeconds) + randomSeconds,
            'seconds');
}
const getNewUpdateTime = R.curry(_getNewUpdateTime);

// addApiLinkToGeeklist :: Request -> Geeklist -> Geeklist
const _addApiLinkToGeeklist = (req, geeklist) => ({
  apiUrl: `${req.protocol}://${req.get('Host')}/groups/${geeklist.group_slug}/geeklist/${geeklist.id}`,
  ...geeklist
});
const addApiLinkToGeeklist = R.curry(_addApiLinkToGeeklist);

// addApiLinkToGeeklists :: Request -> [Geeklist] -> [Geeklist]
const _addApiLinkToGeeklists = (req, groups) => R.map(addApiLinkToGeeklist(req), groups);
const addApiLinkToGeeklists = R.curry(_addApiLinkToGeeklists);

const newGeeklist = geeklist => {
  let created_at = moment().unix();

  return {
    update: true,
    created_at,
    ...geeklist
  };
};

const selectGeeklistsByGroupSlug = slug =>
      db('geeklists')
      .select('id', 'title', 'year', 'month', 'update', 'group_slug',
              'created_at', 'updated_at', 'next_update_at')
      .orderBy('year', 'desc')
      .orderBy('month', 'desc')
      .orderBy('title');

const insertGeeklist = geeklist =>
      db('geeklists')
      .insert(geeklist)
      .then(() => geeklist);

const delGeeklist = (id, group_slug) => db('geeklists')
      .where({ id, group_slug })
      .del()
      .then(() => ({ method: 'delete', id, group_slug }))

const getGeeklistsByGroupSlug = (req, res, next) =>
      Promise.resolve(req.params.slug)
      .then(selectGeeklistsByGroupSlug)
      .then(addApiLinkToGeeklists(req))
      .then(geeklists => ({ slug: req.params.slug, geeklists }))
      .then(res.json.bind(res))
      .catch(next);

const postGeeklist = (req, res, next) =>
      Promise.resolve(req.body)
      .then(newGeeklist)
      .then(insertGeeklist)
      .then(addApiLinkToGeeklist(req))
      .then(res.status(201).json.bind(res))
      .catch(next);

const deleteGeeklist = (req, res, next) =>
      delGeeklist(req.params.id, req.params.slug)
      .then(res.json.bind(res))
      .catch(next);

module.exports = {
  getNewUpdateTime,
  addApiLinkToGeeklist,
  addApiLinkToGeeklists,
  newGeeklist,
  selectGeeklistsByGroupSlug,
  insertGeeklist,
  delGeeklist,
  getGeeklistsByGroupSlug,
  postGeeklist,
  deleteGeeklist
};
