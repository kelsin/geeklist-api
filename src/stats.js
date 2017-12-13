const db = require('./db');
const logger = require('./logger');
const Promise = require('bluebird');
const R = require('ramda');

const geeklistFields = ['geeklist_id', 'title', 'year', 'month'];
const statFields = ['entries', 'games', 'users', 'uniques', 'summaries', 'ratings'];
const pickStats = R.pick(statFields);
const removeNull = R.pickBy(R.identity);
const statsReducer = (totals, stats) => R.compose(R.fromPairs,
                                                 R.map(([k, v]) => [k, R.propOr(0, k, totals) + v]),
                                                 R.toPairs)(stats);
const sumFields = R.reduce(statsReducer, {});
const total = field => R.compose(R.sum, R.map(R.prop(field)));
const stats = R.compose(sumFields, R.map(pickStats));
const addTotalStatsFromGeeklistStats = data => ({
    stats: R.compose(sumFields, R.map(R.prop('stats')))(R.values(data.geeklists)),
    ...data
});

const transformCounts = geeklist => ({
    ...R.omit(statFields, geeklist),
    stats: R.map(Number, R.pick(statFields, geeklist))
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

const inGeeklist = R.propEq('geeklist_id');
const moveEntriesToGeeklists = R.curry((omit, data) => {
    let entries = data.entries;
    return {
        ...data,
        geeklists: R.map(geeklist => {
            return {
                ...geeklist,
                entries: R.compose(
                    R.sortWith([R.descend(R.prop('postdate'))]),
                    R.map(R.omit(geeklistFields)),
                    R.map(R.omit(omit)),
                    R.filter(inGeeklist(geeklist.geeklist_id))
                )(entries)
            };
        }, data.geeklists),
        entries: undefined
    }
});

const addGameData = data => {
    return {
        objectname: data.entries[0].objectname,
        objectid: data.entries[0].objectid,
        imageid: data.entries[0].imageid,
        group_slug: data.group_slug,
        stats: data.stats,
        ratings: data.ratings,
        geeklists: data.geeklists,
        entries: data.entries
    };
};

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

const forUser = R.curry((username, query) => query.where('items.username', username));
const forGame = R.curry((id, query) => query.where('items.objectid', id));
const forGroup = R.curry((slug, query) => query.where('geeklists.group_slug', slug));
const forGeeklist = R.curry((id, query) => query.where('items.geeklist_id', id));

const byUser = query => query
      .select('items.username')
      .groupBy('items.username');

const byGame = query => query
      .select('items.objectid', 'items.objectname')
      .groupBy('items.objectid', 'items.objectname');

const byGeeklist = query => query
      .select('geeklists.group_slug', 'geeklists.id',
              'geeklists.title', 'geeklists.year', 'geeklists.month',
              'geeklists.created_at', 'geeklists.updated_at', 'geeklists.next_update_at')
      .orderBy('geeklists.year', 'desc')
      .orderBy('geeklists.month', 'desc')
      .groupBy('geeklists.group_slug', 'geeklists.id',
               'geeklists.title', 'geeklists.year', 'geeklists.month',
               'geeklists.created_at', 'geeklists.updated_at', 'geeklists.next_update_at');

const entries = db => db
      .from('items')
      .leftJoin('geeklists', 'items.geeklist_id', 'geeklists.id');

const convertRatings = R.map(R.over(R.lensProp('rating'), Number));

const selectUserStatsForGroup = (slug, username) => {
    logger.debug("Looking up " + username + " stats for group: " + slug);

    return R.compose(selectCounts,
                     forUser(username),
                     forGroup(slug),
                     byUser,
                     byGeeklist,
                     entries)(db)
        .then(R.map(R.compose(transformCounts, R.omit(['users', 'username']))))
        .then(R.indexBy(R.prop("geeklist_id")))
};

const selectGameStatsForGroup = (slug, id) => {
    logger.debug("Looking up " + id + " stats for group: " + slug);

    return R.compose(selectCounts,
                     forGame(id),
                     forGroup(slug),
                     byGame,
                     byGeeklist,
                     entries)(db)
        .then(R.map(R.compose(transformCounts, R.omit(['games', 'objectid', 'objectname']))))
        .then(R.indexBy(R.prop('geeklist_id')));
};

const selectUserRatingsForGroup = (slug, username) => {
    logger.debug("Looking up " + username + " ratings for group: " + slug);

    return R.compose(selectRatings,
                     forUser(username),
                     forGroup(slug),
                     entries)(db)
        .then(R.map(R.omit(['username'])))
        .then(R.sortWith([R.descend(R.prop('rating')),
                          R.descend(R.prop('postdate'))]))
        .then(convertRatings);
};

const selectGameRatingsForGroup = (slug, id) => {
    logger.debug("Looking up " + id + " ratings for group: " + slug);

    return R.compose(selectRatings,
                     forGame(id),
                     forGroup(slug),
                     entries)(db)
        .then(R.map(R.omit(['objectid', 'objectname', 'imageid'])))
        .then(R.sortWith([R.descend(R.prop('rating')),
                          R.descend(R.prop('postdate'))]))
        .then(convertRatings);
};

const selectUserEntriesForGroup = (slug, username) => {
    logger.debug("Looking up " + username + " entries for group: " + slug);

    return R.compose(selectEntries,
                     forUser(username),
                     forGroup(slug),
                     entries)(db)
        .then(convertRatings);
};

const selectGameEntriesForGroup = (slug, id) => {
    logger.debug("Looking up " + id + " entries for group: " + slug);

    return R.compose(selectEntries,
                     forGame(id),
                     forGroup(slug),
                     entries)(db)
        .then(convertRatings);
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
                entries)(db)
        .then(convertRatings);
};

const getUserStatsForGroup = (req, res, next) => {
    return Promise.props({
        username: req.params.username,
        group_slug: req.params.slug,
        ratings: selectUserRatingsForGroup(req.params.slug, req.params.username),
        geeklists: selectUserStatsForGroup(req.params.slug, req.params.username),
        entries: selectUserEntriesForGroup(req.params.slug, req.params.username)
    })
        .then(addTotalStatsFromGeeklistStats)
        .then(moveEntriesToGeeklists(['username']))
        .then(res.json.bind(res))
        .catch(next);
}

const getGameStatsForGroup = (req, res, next) => {
    return Promise.props({
        game: req.params.id,
        group_slug: req.params.slug,
        ratings: selectGameRatingsForGroup(req.params.slug, req.params.id),
        geeklists: selectGameStatsForGroup(req.params.slug, req.params.id),
        entries: selectGameEntriesForGroup(req.params.slug, req.params.id)
    })
        .then(addTotalStatsFromGeeklistStats)
        .then(addGameData)
        .then(moveEntriesToGeeklists(['objectname', 'objectid', 'imageid']))
        .then(res.json.bind(res))
        .catch(next);
}

const getGeeklistStatsForGroup = (req, res, next) => {
    return Promise.props({
        geeklist: selectGeeklistStatsForGroup(req.params.slug, req.params.id),
        entries: selectGeeklistEntriesForGroup(req.params.slug, req.params.id)
    })
        .then(d => ({
            ...d.geeklist,
            entries: R.compose(R.sortWith([R.descend(R.prop('postdate'))]),
                               R.map(R.omit(geeklistFields)))(d.entries)
        }))
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
