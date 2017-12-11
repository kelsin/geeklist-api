const bgg = require('./bgg');
const db = require('./db');
const logger = require('./logger');
const moment = require('moment');
const Promise = require('bluebird');
const R = require('ramda');

const randomInt = (min, max) =>
      Math.floor(min + Math.random() * (max + 1 - min));

// getNewUpdateTime :: Number -> Moment -> Moment
const _getNewUpdateTime = (minimumUpdateSeconds, now, randomSeconds, lastUpdated) => {
  let diff = now.diff(lastUpdated);
  let newUpdateSeconds = diff / 4000;
  logger.debug("Geeklist last updated at " + lastUpdated.toString() + ", " + (diff / 1000) + " seconds ago");
  logger.debug("Updating it again in " + newUpdateSeconds + " seconds");
  logger.debug("Min: " + minimumUpdateSeconds + ", Random: " + randomSeconds);
  let result = now.add(Math.max(minimumUpdateSeconds,
                                newUpdateSeconds) + randomSeconds,
                       'seconds');
  logger.debug("Result: " + result.toString());
  return result;
}
const getNewUpdateTime = R.curry(_getNewUpdateTime);

// addApiLinkToGeeklist :: Request -> Geeklist -> Geeklist
const _addApiLinkToGeeklist = (req, geeklist) => ({
  apiUrl: `${req.protocol}://${req.get('Host')}/group/${geeklist.group_slug}/geeklist/${geeklist.id}`,
  ...geeklist
});
const addApiLinkToGeeklist = R.curry(_addApiLinkToGeeklist);

// addApiLinkToGeeklists :: Request -> [Geeklist] -> [Geeklist]
const _addApiLinkToGeeklists = (req, groups) => R.map(addApiLinkToGeeklist(req), groups);
const addApiLinkToGeeklists = R.curry(_addApiLinkToGeeklists);

const newGeeklist = geeklist => {
  let created_at = moment().utc().toDate();
  let updated_at = created_at;
  let next_update_at = created_at;

  return {
    update: true,
    created_at,
    updated_at,
    next_update_at,
    ...geeklist
  };
};

const geeklistColumns = ['id', 'title', 'year', 'month', 'update', 'group_slug',
                         'created_at', 'updated_at', 'next_update_at'];


const selectGeeklistsForUpdating = () =>
      db('geeklists')
      .select(geeklistColumns)
      .where('next_update_at', '<=', db.fn.now())
      .orderBy('next_update_at');

const selectGeeklistsByGroupSlug = slug =>
      db('geeklists')
      .select(geeklistColumns)
      .orderBy('year', 'desc')
      .orderBy('month', 'desc')
      .orderBy('title');

const updateInFive = id => {
  let now = moment().utc();
  return db('geeklists')
    .returning(geeklistColumns)
    .where({ id })
    .update({ next_update_at: now.add(5, 'seconds').toDate() });
};

const updateTitle = (id, title, lastUpdated) => {
  let now = moment().utc();
  return db('geeklists')
    .returning(geeklistColumns)
    .where({ id })
    .update({
      title,
      updated_at: now.toDate(),
      next_update_at: getNewUpdateTime(300, now, randomInt(1, 60), lastUpdated).toDate()
    });
};

const insertGeeklist = geeklist =>
      db('geeklists')
      .returning(geeklistColumns)
      .insert(geeklist)
      .then(R.find(R.always(true)));

const delGeeklist = (id, group_slug) => db('geeklists')
      .where({ id, group_slug })
      .del()
      .then(() => ({ method: 'delete', id, group_slug }))

const getUpdating = (req, res, next) =>
      Promise.resolve(selectGeeklistsForUpdating())
      .then(addApiLinkToGeeklists(req))
      .then(geeklists => ({ geeklists }))
      .then(res.json.bind(res))
      .catch(next);

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

const getLastUpdatedDate = geeklist => {
  let dates = R.chain(item => {
    if(!item.$) { return []; }
    if(!item.$.editdate) { return [item.$.postdate]; }
    return [item.$.editdate, item.$.postdate];
  }, geeklist.item);

  let moments = R.map(date => moment(date).utc(), dates);

  let lastUpdatedDate = R.reduce((current, date) =>
                                 current.isAfter(date) ? current : date,
                                 moment(geeklist.postdate[0]).utc(),
                                 moments);

  logger.debug("Geeklist posted: " + moment(geeklist.postdate[0]).utc().toString());
  logger.debug("Last updated date: " + lastUpdatedDate.toString());

  return lastUpdatedDate;
};

const updateGeeklist = id =>
      bgg.getGeeklist(id)
      .then(result => {
        if(result.message) {
          throw "Update Queued, waiting for 5 seconds";
        } else {
          return result;
        }
      })
      .then(result => updateTitle(id,
                                 result.geeklist.title[0],
                                 getLastUpdatedDate(result.geeklist)))
      .catch((err) => {
        logger.error(err);
        return updateInFive(id);
      });

const _logGeeklists = (verb, geeklists) => {
  return geeklists.map(geeklist => {
    logger.info(`${verb} ${geeklist.id}${geeklist.title ? ':' + geeklist.title : ''}`);
    return geeklist;
  });
};
const logGeeklists = R.curry(_logGeeklists);

const updateGeeklists = () =>
      selectGeeklistsForUpdating()
      .then(logGeeklists("Updating"))
      .then(R.map(R.prop('id')))
      .map(updateGeeklist);

const postUpdate = (req, res, next) =>
      updateGeeklists()
      .then(res.json.bind(res))
      .catch(next);

module.exports = {
  getNewUpdateTime,
  addApiLinkToGeeklist,
  addApiLinkToGeeklists,
  newGeeklist,
  selectGeeklistsForUpdating,
  selectGeeklistsByGroupSlug,
  insertGeeklist,
  delGeeklist,
  getGeeklistsByGroupSlug,
  postGeeklist,
  deleteGeeklist,
  getUpdating,
  updateGeeklist,
  updateGeeklists,
  postUpdate,
  getLastUpdatedDate
};
