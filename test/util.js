/* eslint-env mocha */
const { expect } = require('chai');

const util = require('../lib/util');

describe('lib/util', () => {
  describe('unzip()', () => {
    it('unzips', () => {
      expect(util.unzip([
        [1, 2, 3, 4],
        [1, 2, 3, 4],
        [1, 2, 3, 4],
      ]))
      .to.deep.equal([
        [1, 1, 1],
        [2, 2, 2],
        [3, 3, 3],
        [4, 4, 4],
      ]);
    });

    it('returns an empty array on bad args', () => {
      expect(util.unzip()).to.deep.equal([]);
      expect(util.unzip([])).to.deep.equal([]);
    });
  });

  describe('childrenAreEqualLength()', () => {
    it('works', () => {
      expect(util.childrenAreEqualLength([
        [1, 2, 3],
        [1, 2, 3],
      ])).to.equal(true);
      expect(util.childrenAreEqualLength([
        [1, 2],
        [1, 2, 3],
      ])).to.equal(false);
    });
  });

  describe('chunk()', () => {
    it('chunks', () => {
      expect(util.chunk([1, 2, 3, 4, 5, 6], 2))
      .to.deep.equal([[1, 2], [3, 4], [5, 6]]);
    });
  });

  describe('flatten()', () => {
    it('flattens an array', () => {
      expect(util.flatten([[1, 2], [3, 4]]))
      .to.deep.equal([1, 2, 3, 4]);
    });
  });

  describe('cleanSearchString', () => {
    it('removes unwanted text from search strings', () => {
      expect(util.cleanSearchString('foo and bar')).to.equal('foo bar');
      expect(util.cleanSearchString('foo AND bar')).to.equal('foo bar');
      expect(util.cleanSearchString('enter sandman')).to.equal('enter sandman');
      expect(util.cleanSearchString('And you will know us by the trail of dead')).to.equal('And you will know us by the trail of dead');
    });
  });
});
