const bgg = require('./bgg');

module.exports = {
  routes: {
    "/": "List of all groups that this api monitors",
    "/group/:group/": "List of all geeklists in a group",
    "/group/:group/geeklist/:id/": "Stats for an individual geeklist",
    "/group/:group/user/:id": "Stats for an individual user",
    "/group/:group/game/:id": "Stats for an individual game",
  },
  bgg: {
    url: bgg.BGG_URL,
    thread_path: bgg.BGG_THREAD_PATH
  },
  links: {
    code: "https://github.com/kelsin/geeklist-api",
    issues: "https://github.com/kelsin/geeklist-api/issues",
    travis: "https://travis-ci.org/kelsin/geeklist-api",
    codeclimate: "https://codeclimate.com/github/kelsin/geeklist-api"
  }
};
