const db = require('./db');
const moment = require('moment');
const R = require('ramda');

const links = require('./links');

// addApiLinkToGroup :: Request -> Group -> Group
const _addApiLinkToGroup = (req, group) => ({
  apiUrl: `${req.protocol}://${req.get('Host')}/groups/${group.slug}`,
  ...group
});
const addApiLinkToGroup = R.curry(_addApiLinkToGroup);

// addApiLinkToGroups :: Request -> [Group] -> [Group]
const _addApiLinkToGroups = (req, groups) => R.map(addApiLinkToGroup(req), groups);
const addApiLinkToGroups = R.curry(_addApiLinkToGroups);

const newGroup = group => {
  let created_at = moment().unix();
  let updated_at = created_at;

  return {
    created_at,
    updated_at,
    ...group
  };
}
const selectGroups = () =>
      db('groups')
      .select('slug', 'name', 'thread',
              'created_at', 'updated_at')
      .orderBy('slug');

const insertGroup = group =>
      db('groups')
      .insert(group)
      .then(() => group);

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
