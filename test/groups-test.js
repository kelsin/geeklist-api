const expect = require('chai').expect;
const groups = require('../src/groups');

describe("groups.js", function() {
  describe("addApiLinksToGroups()", function() {
    it("should add a group link to a request", function() {
      let request = {
        protocol: 'https',
        get() { return 'hostname:port'; }
      };
      let input = [{
        id: 1
      },{
        id: 2
      }]

      let result = [{
        id: 1,
        apiUrl: 'https://hostname:port/groups/1'
      }, {
        id: 2,
        apiUrl: 'https://hostname:port/groups/2'
      }];

      expect(groups.addApiLinksToGroups(request, input)).to.deep.equal(result);
    })
  })
})
