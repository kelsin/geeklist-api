const db = require('./db');
const logger = require('./logger');
const moment = require('moment');
const R = require('ramda');

const links = require('./links');

// addApiLinkToGroup :: Request -> Group -> Group
const _addApiLinkToGroup = (req, group) => ({
  apiUrl: `${req.protocol}://${req.get('Host')}/group/${group.slug}`,
  ...group
});
const addApiLinkToGroup = R.curry(_addApiLinkToGroup);

// addApiLinkToGroups :: Request -> [Group] -> [Group]
const _addApiLinkToGroups = (req, groups) => R.map(addApiLinkToGroup(req), groups);
const addApiLinkToGroups = R.curry(_addApiLinkToGroups);

const newGroup = group => {
  let created_at = moment().utc().toDate();
  let updated_at = created_at;

  return {
    created_at,
    updated_at,
    ...group
  };
}

const groupColumns = ['slug', 'name', 'thread', 'imageid', 'created_at', 'updated_at'];

const selectGroups = () =>
      db('groups')
      .select(groupColumns)
      .orderBy('slug');

const insertGroup = group => {
    logger.debug("Inserting", group);
    return db('groups')
        .returning(groupColumns)
        .insert(group)
        .then(R.find(R.always(true)))
        .catch(err => {
            logger.debug(err);
            logger.debug("Updating", group);
            return db('groups')
                .returning(groupColumns)
                .where({ slug: group.slug })
                .update(group);
        });
};

const delGroup = slug => db('groups')
      .where({ slug })
      .del()
      .then(() => ({ method: 'delete', slug }))

const getGroups = (req, res, next) =>
      selectGroups()
      .then(addApiLinkToGroups(req))
      .then(groups => ({...links, groups }))
      .then(res.json.bind(res))
      .catch(next);

const postGroup = (req, res, next) =>
      Promise.resolve(req.body)
      .then(newGroup)
      .then(insertGroup)
      .then(addApiLinkToGroup(req))
      .then(res.status(201).json.bind(res))
      .catch(next);

const deleteGroup = (req, res, next) =>
      delGroup(req.params.slug)
      .then(res.json.bind(res))
      .catch(next);

module.exports = {
  addApiLinkToGroup,
  addApiLinkToGroups,
  getGroups,
  postGroup,
  deleteGroup
};
