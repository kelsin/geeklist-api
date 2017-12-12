const expect = require('chai').expect;
const bgg = require('../src/bgg');

describe("bgg.js", function() {
  describe("getItemSummary()", function() {
    it("should handle no summary", function() {
      expect(bgg.getItemSummary("No summary")).to.be.undefined;
    });

    it("should handle empty summarys", function() {
      expect(bgg.getItemSummary("<summary></summary>")).to.be.undefined;
    });

    it("should retrieve the summary from a line", function() {
      expect(bgg.getItemSummary("<summary>Testing</summary>")).to.equal("Testing");
    });

    it("should retrieve the summary from a paragraph", function() {
      expect(bgg.getItemSummary("Other Stuff\nEven on <summary>Testing Paragraphs</summary> the\nsame line.")).to.equal("Testing Paragraphs");
    });
  });

  describe("getItemRating()", function() {
    it("should handle no rating", function() {
      expect(bgg.getItemRating("No rating")).to.be.undefined;
    });

    it("should handle empty ratings", function() {
      expect(bgg.getItemRating("<rating></rating>")).to.be.undefined;
    });

    it("should retrieve the rating from a line", function() {
      expect(bgg.getItemRating("<rating>4.5</rating>")).to.equal(4.5);
    });

    it("should retrieve the summary from a paragraph", function() {
      expect(bgg.getItemRating("Other Stuff\nEven on <rating>3.25</rating> the\nsame line.")).to.equal(3.25);
    });

    it("should work with NaN ratings", function() {
      expect(bgg.getItemRating("Other Stuff\nEven on <rating>Testing Paragraphs</rating> the\nsame line.")).to.be.undefined;
    })
  });
});
