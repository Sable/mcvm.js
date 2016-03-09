var test = require('unit.js')
var assert = require('assert')
var path = require('path')

describe('matlab.js', function () {
    var matlab = require(path.join(__dirname, '../lib/matlab'))

    describe('Array', function () {
        it('create', function () {
            assert.deepEqual(matlab.Array().getSize(), matlab.Array.fromJSArray([0, 1]))
            assert.deepEqual(matlab.Array(5).getSize(), matlab.Array.fromJSArray([1, 5]))
            assert.deepEqual(matlab.Array(10,20).getSize(), matlab.Array.fromJSArray([10, 20]))
            assert.throws(function () {
                matlab.Array(10,20,30)
            }, Error, 'matlab.Array: Unimplemented arrays with 3 or more dimensions')
        })

        it('forEach', function () {
            var values = []
            var indexes = []
            var a = matlab.Array.fromJSArray([4,5,6])
            a.forEach(function (v, i) {
                values.push(v)
                indexes.push(i)
            })
            assert.deepEqual(values, [4,5,6])
            assert.deepEqual(indexes, [1,2,3])
        })

        it('equals', function () {
            assert.ok(matlab.Array.fromJSArray([1,2,3]).equals(matlab.Array.fromJSArray([1,2,3])))
        })

        it('get', function () {
            var a = matlab.Array.fromJSArray([4,5,6,7])
            assert.throws(function () { a.get(0) }, Error, 'Subscript indices must either be real positive integers or logicals.')
            assert.throws(function () { a.get(-1) }, Error, 'Subscript indices must either be real positive integers or logicals.')
            assert.ok(a.get().equals(a.copy()))
            assert.equal(a.get(1), 4)
            assert.throws(function () { a.get(5) }, Error, 'Index exceeds matrix dimensions.')

            var a = matlab.Array.fromJSArray([4,5,6,7,8,9], [2,3])
            assert.throws(function () { a.get(3,1) }, Error, 'Index exceeds matrix dimensions.')
            assert.throws(function () { a.get(2,4) }, Error, 'Index exceeds matrix dimensions.')
            assert.equal(a.get(1), 4)
            assert.equal(a.get(4), 7)
            assert.equal(a.get(2,2), 7)
        })

        it('set', function () {
            var a = matlab.Array.fromJSArray([4,5,6,7])
            assert.deepEqual(a.set(1, 1, 1), matlab.Array.fromJSArray([1,5,6,7]))
            assert.deepEqual(a.set(1, 2, 1), matlab.Array.fromJSArray([1,1,6,7]))
        })

        it('copy', function () {
            var a = matlab.Array.fromJSArray([4,5,6,7])
            var b = a.copy()
            assert.ok(a.equals(a,b))
            assert.equal(a._array, b._array)
            b.set(1, 1, 1)
            assert.ok(!a.equals(b))
            assert.ok(a.equals(matlab.Array.fromJSArray([4,5,6,7])))
            assert.ok(b.equals( matlab.Array.fromJSArray([1,5,6,7])))
            assert.notEqual(a._array, b._array)
        })
    })
    
})
