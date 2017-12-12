const expect = require('chai').expect;
const bgg = require('../src/bgg');

describe("bgg.js", function() {
  describe("Star Regexps", function() {
    it("should be able to count stars", function() {
      expect(":star:".match(bgg.STAR_RE)).to.deep.equal([":star:"])
      expect(":halfstar:".match(bgg.HALFSTAR_RE)).to.deep.equal([":halfstar:"])
    });

    it("should match any combination of stars together", function() {
      // Singles
      expect(bgg.STARS_RE.test(":star:")).to.be.true;
      expect(bgg.STARS_RE.test(":nostar:")).to.be.true;
      expect(bgg.STARS_RE.test(":halfstar:")).to.be.true;

      expect(bgg.STARS_RE.test(":star::halfstar::nostar:")).to.be.true;

      expect(bgg.STARS_RE.test("with extra :star::halfstar::nostar: text\nand new lines")).to.be.true;
    })
  });

  describe('getStarValue()', function() {
    it("should accuratly find the value", function() {
      expect(bgg.getStarValue(":star::star::halfstar::nostar::nostar:")).to.equal(2.5);
      expect(bgg.getStarValue(":star::star::star::star::star:")).to.equal(5.0);
      expect(bgg.getStarValue(":star::star::star::star::star::star:")).to.equal(5.0);
      expect(bgg.getStarValue(":halfstar:")).to.equal(0.5);
      expect(bgg.getStarValue("with extra text :star::star: and\nnewlines")).to.equal(2.0);
      expect(bgg.getStarValue("first :star::star: the first only :star:")).to.equal(2.0);
      expect(bgg.getStarValue(":nostar::nostar::nostar:")).to.equal(0.0);
    })
  });

  describe('normalizeRating()', function() {
    it("should normalize rating numbers to 0 -> # -> 5", function() {
      expect(bgg.normalizeRating(-1.0)).to.equal(0.0);
      expect(bgg.normalizeRating(0.0)).to.equal(0.0);
      expect(bgg.normalizeRating(3.0)).to.equal(3.0);
      expect(bgg.normalizeRating(5.0)).to.equal(5.0);
      expect(bgg.normalizeRating(6.0)).to.equal(5.0);
    });

    it("should convert to numbers first", function() {
      expect(bgg.normalizeRating("6.0")).to.equal(5.0);
      expect(bgg.normalizeRating("testing")).to.equal(0.0);
    })
  });

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
