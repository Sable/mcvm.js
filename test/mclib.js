var test = require('unit.js')
var assert = require('assert')
var path = require('path')

describe('mclib.js', function () {
  var stdlib = require(path.join(__dirname, '../lib/mclib')).stdlib
  var matlab = require(path.join(__dirname, '../lib/matlab'))
  var numeric = require(path.join(__dirname, '../lib/numeric'))

  describe('McLib', function () {
    it('ones', function () {
      assert.deepEqual(stdlib.ones(), 1)
      assert.deepEqual(stdlib.ones(1), 1)
      assert.deepEqual(stdlib.ones(2), matlab.Array.fromJSArray([1, 1, 1, 1], [2, 2]))
      assert.deepEqual(stdlib.ones(2, 3), matlab.Array.fromJSArray([1, 1, 1, 1, 1, 1], [2, 3]))
    })

    it('zeros', function () {
      assert.deepEqual(stdlib.zeros(), 0)
      assert.deepEqual(stdlib.zeros(1), 0)
      assert.deepEqual(stdlib.zeros(2), matlab.Array.fromJSArray([0, 0, 0, 0], [2, 2]))
      assert.deepEqual(stdlib.zeros(2, 3), matlab.Array.fromJSArray([0, 0, 0, 0, 0, 0], [2, 3]))
    })

    it('length', function () {
      var a = [1, 2, 3, 4, 5, 6]
      assert.equal(stdlib.length(matlab.Array.fromJSArray(a)), 6)
      assert.equal(stdlib.length(matlab.Array.fromJSArray(a, [2, 3])), 3)
      assert.equal(stdlib.length(matlab.Array.fromJSArray(a, [3, 2])), 3)
      assert.equal(stdlib.length(matlab.Array.fromJSArray(a, [1, 6])), 6)
      assert.equal(stdlib.length(matlab.Array.fromJSArray(a, [6, 1])), 6)
    })

    it('mtimes', function () {
      var a = stdlib.ones(1, 4)
      assert.deepEqual(stdlib.mtimes(a, 100), matlab.Array.fromJSArray([100, 100, 100, 100]))
      assert.deepEqual(stdlib.mtimes(100, a), matlab.Array.fromJSArray([100, 100, 100, 100]))
      assert.deepEqual(stdlib.mtimes(100, 23), 2300)
    })

    it('tictoc', function () {
      stdlib.tic()
      for (var i = 0; i < 100000; ++i) {
        Math.random()
      }
      var t = stdlib.toc()
      assert.ok(t > 0 && t < 1)
    })

    it('binop', function () {
      assert.equal(stdlib.plus(1, 2), 3)
      assert.equal(stdlib.plus(1, 0), 1)
      assert.equal(stdlib.minus(2, 1), 1)
      assert.equal(stdlib.minus(1, 2), -1)
      assert.equal(stdlib.ge(1, 2), 0)
      assert.equal(stdlib.ge(2, 2), 1)
      assert.equal(stdlib.ge(3, 2), 1)
      assert.equal(stdlib.le(1, 2), 1)
      assert.equal(stdlib.le(2, 2), 1)
      assert.equal(stdlib.le(3, 1), 0)
      assert.equal(stdlib.lt(1, 2), 1)
      assert.equal(stdlib.lt(2, 2), 0)
      assert.equal(stdlib.lt(3, 1), 0)
      assert.equal(stdlib.gt(1, 2), 0)
      assert.equal(stdlib.gt(2, 2), 0)
      assert.equal(stdlib.gt(3, 1), 1)

      assert.equal(stdlib.eq(2, 1), 0)
      assert.equal(stdlib.eq(2, 2), 1)
      assert.equal(stdlib.eq(1, 2), 0)
      assert.equal(stdlib.ne(2, 1), 1)
      assert.equal(stdlib.ne(2, 2), 0)
      assert.equal(stdlib.ne(1, 2), 1)
    })

    it('randn', function () {
      assert.ok(stdlib.randn(1, 10).getSize().equals(matlab.Array.fromJSArray([1, 10])))
    })

    it('any', function () {
      assert.equal(stdlib.any(0), 0)
      assert.equal(stdlib.any(1), 1)
      assert.equal(stdlib.any(matlab.Array.fromJSArray([0, 0])), 0)
      assert.equal(stdlib.any(matlab.Array.fromJSArray([0, 1])), 1)
      assert.equal(stdlib.any(matlab.Array.fromJSArray([1, 1])), 1)

      assert.equal(stdlib.any(matlab.Array.fromJSArray([[0, 0], [0, 0]])), 0)
      assert.equal(stdlib.any(matlab.Array.fromJSArray([[0, 0], [1, 0]])), 1)
      assert.equal(stdlib.any(matlab.Array.fromJSArray([[2, 0], [0, 0]])), 1)
    })

    it('all', function () {
      assert.equal(stdlib.all(0), 0)
      assert.equal(stdlib.all(1), 1)

      assert.equal(stdlib.all(matlab.Array.fromJSArray([0, 0])), 0)
      assert.equal(stdlib.all(matlab.Array.fromJSArray([0, 1])), 0)
      assert.equal(stdlib.all(matlab.Array.fromJSArray([1, 1])), 1)

      assert.equal(stdlib.all(matlab.Array.fromJSArray([[0, 0], [0, 0]])), 0)
      assert.equal(stdlib.all(matlab.Array.fromJSArray([[0, 0], [1, 0]])), 0)
      assert.equal(stdlib.all(matlab.Array.fromJSArray([[2, 0], [0, 0]])), 0)

      assert.equal(stdlib.all(matlab.Array.fromJSArray([[2, 1], [3, 1]])), 1)
    })
    it('eq-scalar', function () {
      assert.equal(stdlib.eq(1, 1), 1)
      assert.equal(stdlib.eq(0, 1), 0)
    })

    it('eq-non-scalar', function () {
      var a = matlab.Array.fromJSArray([[1, 2, 4]])
      var b = matlab.Array.fromJSArray([[1, 2, 4]])
      var c = stdlib.eq(a, b)
      assert.deepEqual(c, matlab.Array.fromJSArray([1, 1, 1]))

      a = matlab.Array.fromJSArray([[1, 2, 4]])
      b = matlab.Array.fromJSArray([[1, 2, 3]])
      c = stdlib.eq(a, b)
      assert.deepEqual(c, matlab.Array.fromJSArray([1, 1, 0]))
    })
  })
})
