const R = require('ramda');
const db = require('./db');

function _addApiLinkToGroup(req, group) {
  group.apiUrl = `${req.protocol}://${req.get('Host')}/groups/${group.id}`;
  return group;
}
let addApiLinkToGroup = R.curry(_addApiLinkToGroup);

function addApiLinksToGroups(req, groups) {
  return R.map(addApiLinkToGroup(req), groups);
}

function loadGroups(req) {
  return db('groups').select('id', 'slug', 'name');
}

function insertGroup(data) {
  return db('groups').insert(data);
}

function getGroups(req) {
  return loadGroups(req)
    .then(data => addApiLinksToGroups(req, data));
}

function removeGroup(id) {
  return db('groups').where('id', id).del();
}

function addGroup(req, res, next) {
  return insertGroup(req.body)
    .then(ids => ids[0])
    .then(id => ({id, ...req.body}))
    .then(addApiLinkToGroup(req))
    .then(group => res.json(group))
    .catch(next);
}

function deleteGroup(req, res) {
  return removeGroup(req.params.id).then(data => res.json(data));
}

module.exports = { addApiLinksToGroups, getGroups, addGroup, deleteGroup };
