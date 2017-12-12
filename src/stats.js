const db = require('./db');
const logger = require('./logger');
const Promise = require('bluebird');
const R = require('ramda');

const total = prop => R.compose(R.sum, R.map(R.prop(prop)));
const totalGeeklistCounts = data => ({
  totals: {
    entries: total('entries')(data.geeklists),
    games: total('games')(data.geeklists),
    users: total('users')(data.geeklists),
    uniques: total('uniques')(data.geeklists),
    summaries: total('summaries')(data.geeklists),
    ratings: total('ratings')(data.geeklists)
  },
  ...data
});

const transformCounts = stats => ({
  ...stats,
  entries: Number(stats.entries),
  games: Number(stats.games),
  users: Number(stats.users),
  uniques: Number(stats.uniques),
  summaries: Number(stats.summaries),
  ratings: Number(stats.ratings)
});

const selectSummaryCount = query => query
      .select(db.raw('SUM(CASE WHEN "items"."summary" IS NULL THEN 0 ELSE 1 END) as summaries'));

const selectRatingCount = query => query
      .select(db.raw('SUM(CASE WHEN "items"."rating" IS NULL THEN 0 ELSE 1 END) as ratings'));

const selectEntryCount = query => query
      .count('* as entries');

const selectGameCount = query => query
      .countDistinct('items.objectid as games');

const selectUserCount = query => query
      .countDistinct('items.username as users');

const selectUniqueCount = query => query
      .select(db.raw('COUNT(distinct "items"."username" || \'-\' || "items"."objectid") as uniques'));

const selectCounts = R.compose(selectRatingCount,
                               selectSummaryCount,
                               selectUniqueCount,
                               selectUserCount,
                               selectGameCount,
                               selectEntryCount);

const sortGeeklists = R.sortWith([R.descend(R.prop('year')),
                                  R.descend(R.prop('month'))]);

const sortEntriesInGeeklist = R.sortWith([R.descend(R.prop('postdate'))]);

const transformAndSortEntries = R.compose(sortGeeklists,
                                          R.map(geeklist => ({
                                              ...geeklist,
                                              entries: sortEntriesInGeeklist(geeklist.entries)
                                          })),
                                          R.values);

const groupEntriesByGeeklist = R.reduce((entries, entry) => {
    if(!entries[entry.geeklist_id]) {
        entries[entry.geeklist_id] = {
            geeklist_id: entry.geeklist_id,
            title: entry.title,
            year: entry.year,
            month: entry.month,
            entries: []
        }
    }

    entries[entry.geeklist_id].entries.push({
        username: entry.username,
        objectname: entry.objectname,
        objectid: entry.objectid,
        imageid: entry.imageid,
        thumbs: entry.thumbs,
        summary: entry.summary,
        rating: entry.rating,
        id: entry.id,
        postdate: entry.postdate
    });

    return entries;
});

const selectEntries = query => query
      .select("items.username", "items.objectname", "items.objectid",
              "items.imageid", "items.thumbs",
              "items.summary", "items.rating",
              "items.id", "items.postdate",
              "items.geeklist_id", "geeklists.title",
              "geeklists.year", "geeklists.month")
      .orderBy("items.objectname")
      .orderBy("items.postdate", "desc");

const selectRatings = query => query
      .select(db.raw('distinct on("items"."username", "items"."objectname", "items"."objectid", "items"."imageid") "items"."username", "items"."objectname", "items"."objectid", "items"."imageid"'))
      .select("items.summary", "items.rating",
              "items.id", "items.postdate")
      .whereNotNull("items.rating")
      .orderBy("items.username")
      .orderBy("items.objectname")
      .orderBy("items.objectid")
      .orderBy("items.imageid")
      .orderBy("items.postdate", "desc")
      .orderBy("items.rating", "desc");

const _forUser = (username, query) => query
      .where('items.username', username);
const forUser = R.curry(_forUser);

const _forGame = (id, query) => query
      .where('items.objectid', id);
const forGame = R.curry(_forGame);

const _forGroup = (slug, query) => query
      .where('geeklists.group_slug', slug);
const forGroup = R.curry(_forGroup);

const _forGeeklist = (id, query) => query
      .where('items.geeklist_id', id)
const forGeeklist = R.curry(_forGeeklist);

const byUser = query => query
      .select('items.username')
      .groupBy('items.username');

const byGame = query => query
      .select('items.objectid', 'items.objectname')
      .groupBy('items.objectid', 'items.objectname');

const byGeeklist = query => query
      .select('items.geeklist_id',
              'geeklists.title', 'geeklists.year', 'geeklists.month',
              'geeklists.updated_at', 'geeklists.next_update_at')
      .orderBy('geeklists.year', 'desc')
      .orderBy('geeklists.month', 'desc')
      .groupBy('items.geeklist_id',
               'geeklists.title', 'geeklists.year', 'geeklists.month',
               'geeklists.updated_at', 'geeklists.next_update_at');

const entries = db => db
      .from('items')
      .leftJoin('geeklists', 'items.geeklist_id', 'geeklists.id');

const selectUserStatsForGroup = (slug, username) => {
  logger.debug("Looking up " + username + " stats for group: " + slug);

  return R.compose(selectCounts,
              forUser(username),
              forGroup(slug),
              byUser,
              byGeeklist,
              entries)(db)
    .then(R.map(transformCounts));
};

const selectGameStatsForGroup = (slug, id) => {
  logger.debug("Looking up " + id + " stats for group: " + slug);

  return R.compose(selectCounts,
              forGame(id),
              forGroup(slug),
              byGame,
              byGeeklist,
              entries)(db)
    .then(R.map(transformCounts));
};

const selectUserRatingsForGroup = (slug, username) => {
  logger.debug("Looking up " + username + " ratings for group: " + slug);

  return R.compose(selectRatings,
              forUser(username),
              forGroup(slug),
              entries)(db);
};

const selectGameRatingsForGroup = (slug, id) => {
  logger.debug("Looking up " + id + " ratings for group: " + slug);

  return R.compose(selectRatings,
              forGame(id),
              forGroup(slug),
              entries)(db);
};

const selectUserEntriesForGroup = (slug, username) => {
  logger.debug("Looking up " + username + " entries for group: " + slug);

  return R.compose(selectEntries,
              forUser(username),
              forGroup(slug),
              entries)(db)
        .then(groupEntriesByGeeklist({}))
        .then(transformAndSortEntries);
};

const selectGameEntriesForGroup = (slug, id) => {
  logger.debug("Looking up " + id + " entries for group: " + slug);

  return R.compose(selectEntries,
              forGame(id),
              forGroup(slug),
              entries)(db)
        .then(groupEntriesByGeeklist({}))
        .then(transformAndSortEntries);
};

const selectGeeklistStatsForGroup = (slug, id) => {
  logger.debug("Looking up stats for geeklist: " + id + " in group: " + slug);

  return R.compose(selectCounts,
              forGeeklist(id),
              forGroup(slug),
              byGeeklist,
              entries)(db.first())
    .then(transformCounts);
};

const selectGeeklistEntriesForGroup = (slug, id) => {
  logger.debug("Looking up entries for geeklist: " + id + " in group: " + slug);

  return R.compose(selectEntries,
              forGeeklist(id),
              forGroup(slug),
              entries)(db);
};

const getUserStatsForGroup = (req, res, next) => {
  return Promise.props({
    username: req.params.username,
    group: req.params.slug,
    geeklists: selectUserStatsForGroup(req.params.slug, req.params.username),
    ratings: selectUserRatingsForGroup(req.params.slug, req.params.username),
    entries: selectUserEntriesForGroup(req.params.slug, req.params.username)
  })
    .then(totalGeeklistCounts)
    .then(res.json.bind(res))
    .catch(next);
}

const getGameStatsForGroup = (req, res, next) => {
  return Promise.props({
    game: req.params.id,
    group: req.params.slug,
    geeklists: selectGameStatsForGroup(req.params.slug, req.params.id),
    ratings: selectGameRatingsForGroup(req.params.slug, req.params.id),
    entries: selectGameEntriesForGroup(req.params.slug, req.params.id)
  })
    .then(totalGeeklistCounts)
    .then(res.json.bind(res))
    .catch(next);
}

const getGeeklistStatsForGroup = (req, res, next) => {
  return Promise.props({
    groups: req.params.slug,
    geeklist: selectGeeklistStatsForGroup(req.params.slug, req.params.id),
    entries: selectGeeklistEntriesForGroup(req.params.slug, req.params.id)
  })
    .then(res.json.bind(res))
    .catch(next);
}

module.exports = {
    getGeeklistStatsForGroup,
    getUserStatsForGroup,
    getGameStatsForGroup,
    sortGeeklists,
    sortEntriesInGeeklist,
    transformAndSortEntries
};
