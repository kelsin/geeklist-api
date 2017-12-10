const expect = require('chai').expect;
const timekeeper = require('timekeeper');
const geeklist = require('../src/geeklist');
const moment = require('moment');

describe('geeklist.js', function() {
  beforeEach(function() {
    timekeeper.freeze(new Date(2018, 0, 1, 9));
  });

  afterEach(function() {
    timekeeper.reset();
  });

  describe('getNewUpdateTime()', function() {
    it('should provide the proper update time based on inputs', function() {
      let currentTime = moment();
      let minimumUpdateSeconds = 300;
      let lastUpdated = moment().subtract(1, 'day');
      let newUpdateTime = moment().add(6, 'hours');

      expect(geeklist
             .getNewUpdateTime(minimumUpdateSeconds,
                               currentTime,
                               0,
                               lastUpdated)
             .isSame(newUpdateTime)).to.be.true;

      let secondUpdateTime = newUpdateTime.add(7.5, 'hours');

      expect(geeklist
             .getNewUpdateTime(minimumUpdateSeconds,
                               newUpdateTime,
                               0,
                               lastUpdated)
             .isSame(secondUpdateTime)).to.be.true;
    });

    it('should add the random time to the update time', function() {
      let currentTime = moment();
      let minimumUpdateSeconds = 300;
      let lastUpdated = moment().subtract(1, 'day');
      let newUpdateTime = moment().add(7, 'hours');

      expect(geeklist
             .getNewUpdateTime(minimumUpdateSeconds,
                               currentTime,
                               3600,
                               lastUpdated)
             .isSame(newUpdateTime)).to.be.true;
    })
  });
});
