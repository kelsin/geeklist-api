const xml2js = require('xml2js');
const Promise = require('bluebird');

function parse(string) {
  return new Promise(function(resolve, reject) {
    return xml2js.parseString(string, function(err, result) {
      return err ? reject(err) : resolve(result);
    });
  });
}

module.exports = { parse };
