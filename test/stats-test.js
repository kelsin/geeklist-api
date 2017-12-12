const expect = require('chai').expect;
const stats = require('../src/stats');

describe("stats.js", function() {
    describe("sortGeeklists", function() {
        it("should sort geeklists", function() {
            const input = [{
                year: 2016,
                month: 12
            },{
                year: 2017,
                month: 10
            },{
                year: 2017,
                month: 11
            }];

            const result = [{
                year: 2017,
                month: 11
            },{
                year: 2017,
                month: 10
            },{
                year: 2016,
                month: 12
            }]

            expect(stats.sortGeeklists(input)).to.deep.equal(result);
        });
    });

    describe("sortEntriesInGeeklist", function() {
        it("should sort entries by postdate", function() {
            const input = [{ postdate: "2017-11-27T16:19:04.000Z"},
                           { postdate: "2017-11-28T16:20:04.000Z"},
                           { postdate: "2017-11-27T16:20:04.000Z"}];
            const result = [{ postdate: "2017-11-28T16:20:04.000Z"},
                            { postdate: "2017-11-27T16:20:04.000Z"},
                            { postdate: "2017-11-27T16:19:04.000Z"}];

            expect(stats.sortEntriesInGeeklist(input)).to.deep.equal(result);
        });
    });

    describe("transformAndSortEntries", function() {
        it("should sort entries and geeklists", function() {
            const input = {
                "list1": {
                    year: 2016,
                    month: 12,
                    entries: [{ postdate: "2017-11-27T16:19:04.000Z"},
                              { postdate: "2017-11-28T16:20:04.000Z"},
                              { postdate: "2017-11-27T16:20:04.000Z"}]
                },
                "list2": {
                    year: 2017,
                    month: 10,
                    entries: [{ postdate: "2017-11-27T16:19:04.000Z"},
                              { postdate: "2017-11-28T16:20:04.000Z"},
                              { postdate: "2017-11-27T16:20:04.000Z"}]
                },
                "list3": {
                    year: 2017,
                    month: 11,
                    entries: [{ postdate: "2017-11-27T16:19:04.000Z"},
                              { postdate: "2017-11-28T16:20:04.000Z"},
                              { postdate: "2017-11-27T16:20:04.000Z"}]
                }
            };

            const result = [{
                year: 2017,
                month: 11,
                entries: [{ postdate: "2017-11-28T16:20:04.000Z"},
                          { postdate: "2017-11-27T16:20:04.000Z"},
                          { postdate: "2017-11-27T16:19:04.000Z"}]
            },{
                year: 2017,
                month: 10,
                entries: [{ postdate: "2017-11-28T16:20:04.000Z"},
                          { postdate: "2017-11-27T16:20:04.000Z"},
                          { postdate: "2017-11-27T16:19:04.000Z"}]
            },{
                year: 2016,
                month: 12,
                entries: [{ postdate: "2017-11-28T16:20:04.000Z"},
                          { postdate: "2017-11-27T16:20:04.000Z"},
                          { postdate: "2017-11-27T16:19:04.000Z"}]
            }];

            expect(stats.transformAndSortEntries(input)).to.deep.equal(result);
        });
    });
});
