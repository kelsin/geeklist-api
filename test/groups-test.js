const expect = require('chai').expect;
const groups = require('../src/groups');

describe("groups.js", function() {
  describe("addApiLinkToGroups()", function() {
    it("should add a group link to a request", function() {
      let request = {
        protocol: 'https',
        get() { return 'hostname:port'; }
      };
      let input = [{
        slug: 'one'
      },{
        slug: 'two'
      }]

      let result = [{
        slug: 'one',
        apiUrl: 'https://hostname:port/groups/one'
      }, {
        slug: 'two',
        apiUrl: 'https://hostname:port/groups/two'
      }];

      expect(groups.addApiLinkToGroups(request, input)).to.deep.equal(result);
    })
  })
})
