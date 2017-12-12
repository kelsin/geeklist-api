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

const getLastUpdatedDate = geeklist => {
    let dates = R.chain(item => [item.postdate, item.editdate],
                        geeklist.items);

    let lastUpdatedDate = R.reduce((current, date) =>
                                   current.isAfter(date) ? current : date,
                                   geeklist.postdate,
                                   dates);

    logger.debug("Geeklist posted: " + geeklist.postdate.toString());
    logger.debug("Last updated date: " + lastUpdatedDate.toString());

    return lastUpdatedDate;
};

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
                         'username', 'numitems', 'thumbs',
                         'created_at', 'updated_at', 'next_update_at'];

const itemColumns = ['id', 'objecttype', 'subtype', 'objectid', 'objectname',
                     'username', 'thumbs', 'imageid', 'summary', 'rating',
                     'postdate', 'geeklist_id', 'created_at', 'updated_at'];

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

const updateGeeklistData = geeklist => {
    let lastUpdated = getLastUpdatedDate(geeklist);
    let now = moment().utc();
    let { id, postdate, editdate, items, ...updates } = geeklist;
    return db('geeklists')
        .returning(geeklistColumns)
        .where({ id: geeklist.id })
        .update({
            updated_at: now.toDate(),
            next_update_at: getNewUpdateTime(300, now, randomInt(1, 60), lastUpdated).toDate(),
            ...updates
        })
        .return(geeklist);
};

const insertGeeklist = geeklist =>
      db('geeklists')
      .returning(geeklistColumns)
      .insert(geeklist)
      .then(R.find(R.always(true)));

const _insertOrUpdateGeeklistItem = (geeklist_id, item) => {
    let created_at = moment().utc().toDate();
    let updated_at = created_at;

    logger.debug("Inserting", item);
    return db('items')
        .returning(itemColumns)
        .insert({
            created_at,
            updated_at,
            geeklist_id,
            id: item.id,
            username: item.username,
            objecttype: item.objecttype,
            subtype: item.subtype,
            objectid: item.objectid,
            objectname: item.objectname,
            postdate: item.postdate,
            thumbs: item.thumbs,
            imageid: item.imageid,
            rating: item.rating,
            summary: item.summary
        })
        .catch(err => {
            logger.debug(err);
            logger.debug("Updating", item);
            return db('items')
                .returning(itemColumns)
                .where({ geeklist_id, id: item.id })
                .update({
                    updated_at,
                    username: item.username,
                    objecttype: item.objecttype,
                    subtype: item.subtype,
                    objectid: item.objectid,
                    objectname: item.objectname,
                    postdate: item.postdate,
                    thumbs: item.thumbs,
                    imageid: item.imageid,
                    rating: item.rating,
                    summary: item.summary
                });
        })
        .then(R.find(R.always(true)));
}
const insertOrUpdateGeeklistItem = R.curry(_insertOrUpdateGeeklistItem);

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

const updateGeeklist = id =>
      Promise.resolve(id)
      .then(bgg.getGeeklist)
      .then(bgg.transformGeeklist)
      .then(updateGeeklistData)
      .then(geeklist => {
          logger.debug(geeklist.items[0]);
          return geeklist;
      })
      .then(geeklist => Promise.map(
          geeklist.items,
          insertOrUpdateGeeklistItem(id),
          { concurrency: 4 })
            .return(geeklist))
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
