const db = require('./db');
const logger = require('./logger');
const R = require('ramda');

const transformUserStatsForGeeklist = stats => ({
  ...stats,
  total: Number(stats.total),
  uniqueGames: Number(stats.uniqueGames),
  summaries: Number(stats.summaries),
  ratings: Number(stats.ratings)
})

const selectUserStatsForGroup = (slug, username) => {
  logger.debug("Looking up " + username + " stats for group: " + slug);
  return db
    .select('items.username', 'items.geeklist_id',
            'geeklists.title', 'geeklists.updated_at', 'geeklists.next_update_at')
    .count('* as total')
    .countDistinct('items.objectid as uniqueGames')
    .select(db.raw('SUM(CASE WHEN "items"."summary" IS NULL THEN 0 ELSE 1 END) as summaries'))
    .select(db.raw('SUM(CASE WHEN "items"."rating" IS NULL THEN 0 ELSE 1 END) as ratings'))
    .from('items')
    .leftJoin('geeklists', 'items.geeklist_id', 'geeklists.id')
    .where('items.username', username)
    .where('geeklists.group_slug', slug)
    .groupBy('items.username', 'items.geeklist_id',
             'geeklists.title', 'geeklists.updated_at', 'geeklists.next_update_at')
    .then(R.map(transformUserStatsForGeeklist));
};

const getUserStatsForGroup = (req, res, next) => {
  return selectUserStatsForGroup(req.params.slug, req.params.username)
    .then(res.json.bind(res))
    .catch(next);
}

module.exports = {
  selectUserStatsForGroup,
  getUserStatsForGroup
};
