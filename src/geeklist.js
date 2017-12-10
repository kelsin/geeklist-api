const moment = require('moment');
const R = require('ramda');

// getNewUpdateTime :: Number -> Moment -> Moment
function _getNewUpdateTime(minimumUpdateSeconds, now, randomSeconds, lastUpdated) {
  let newUpdateSeconds = now.diff(lastUpdated) / 4000;
  return now.add(Math.max(minimumUpdateSeconds,
                     newUpdateSeconds) + randomSeconds,
            'seconds');
}
let getNewUpdateTime = R.curry(_getNewUpdateTime);

module.exports = { getNewUpdateTime };
