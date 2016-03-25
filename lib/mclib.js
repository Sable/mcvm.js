// Taken from Sujay Kathrotia COMP-621 project
if (typeof exports !== 'undefined') {
  if (numeric === undefined) {
    var numeric = require('./numeric')
  }

  if (matlab === undefined) {
    var matlab = require('./matlab')
  }
}

if (typeof global === 'undefined' || global === undefined) {
  global = (function () { return this })()
}

function clone (obj) {
  var clone = {}
  clone.prototype = obj.prototype
  for (var property in obj) clone[property] = obj[property]
  return clone
}

var _McLib = clone(numeric)

_McLib.random = function (x, y, z) {
  if (x === undefined) {
    return numeric.random(1)
  }
  if (y === undefined) {
    y = x
  }

  if (z !== undefined) {
    throw new Error('random: Unsupported 3D matrices')
  }

  return new matlab.Array.fromJSArray(numeric.random([1, x * y])[0], [x, y])
}

_McLib.gen = function (c, x, y, z) {
  var d1, d2
  if (x === undefined) {
    return c
  }
  d1 = x

  if (y === undefined) {
    if (x === 1) {
      return c
    } else {
      d2 = x
    }
  } else {
    d2 = y
  }

  var a = new matlab.Array(d1, d2, z)
  a.forEach(function (v, i) {
    a.set(c, i)
  })
  return a
}

_McLib.zeros = function (x, y, z) {
  return _McLib.gen(0, x, y, z)
}
_McLib.ones = function (x, y, z) {
  return _McLib.gen(1, x, y, z)
}

_McLib.length = function (a) {
  return Math.max.apply(null, a.getSize()._array)
}

_McLib.sqrt = function (x) {
  if (typeof x === 'number') {
    return Math.sqrt(x)
  } else {
    throw new Error('sqrt: Unimplemented for non-scalar values')
  }
}

_McLib.mtimes = (function (a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a * b
  } else if (typeof a === 'number') {
    var b2 = b.copy()
    b2.forEach(function (v, i) {
      b2.set(v * a, i)
    })
    return b2
  } else if (typeof b === 'number') {
    var a2 = a.copy()
    a2.forEach(function (v, i) {
      a2.set(v * b, i)
    })
    return a2
  } else {
    console.log(typeof a)
    console.log(typeof b)
    throw new Error('stdlib.mtimes: Unimplemented times for non-scalar multiplication')
  }
})

_McLib._gen_arithmetic_binop = function (op) {
  return new Function(['a', 'b'],
    "if (typeof a === 'number' && typeof b === 'number') {\n" +
    '    return a ' + op + ' b\n' +
    '} else {\n' +
    "    throw new Error ('Unimplemented binop " + op + " for non-scalars')\n" +
    '}')
}

_McLib._gen_logical_binop = function (op) {
  return new Function(['a', 'b'],
    "if (typeof a === 'number' && typeof b === 'number') {\n" +
    '    return a ' + op + ' b ? 1 : 0\n' +
    '} else {\n' +
    "    throw new Error ('Unimplemented binop " + op + " for non-scalars')\n" +
    '}')
}
_McLib.plus = _McLib._gen_arithmetic_binop('+')
_McLib.minus = _McLib._gen_arithmetic_binop('-')
_McLib.mrdivide = _McLib._gen_arithmetic_binop('/')
_McLib.mod = _McLib._gen_arithmetic_binop('%')

_McLib.gt = _McLib._gen_logical_binop('>')
_McLib.ge = _McLib._gen_logical_binop('>=')
_McLib.le = _McLib._gen_logical_binop('<=')
_McLib.lt = _McLib._gen_logical_binop('<')
_McLib.eq = _McLib._gen_logical_binop('===')
_McLib.ne = _McLib._gen_logical_binop('!==')

// Comment to prevent autoformatting
;(function anonymous () {
  var time
  if (typeof performance === 'undefined') {
    time = Date
  } else {
    time = performance
  }
  var tic = 0
  _McLib.tic = function () {
    tic = time.now()
    return tic
  }

  _McLib.toc = function () {
    return (time.now() - tic) / 1000
  }
})()

/*
_McLib.ceil = function (x) {
  return numeric.ceil([x])[0]
}
_McLib.sqrt = function (x) {
  return numeric.ceil([x])[0]
}
_McLib.cos = function (x) {
  return numeric.cos([x])[0]
}
_McLib.sin = function (x) {
  return numeric.sin([x])[0]
}
_McLib.exp = function (x) {
  return numeric.exp([x])[0]
}
_McLib.log = function (x) {
  return numeric.log([x])[0]
}
_McLib.abs = function (x) {
  return numeric.abs([x])[0]
}
_McLib.pow = function (x, y) {
  if (Object.prototype.toString.call(x) !== '[object Array]')
    return numeric.pow([x], y)[0]
  else
    return numeric.pow(x, y)
}
_McLib.random = function (x, y) {
  var l = arguments.length
  var args = []
  if (arguments > 1 && typeof arguments[l - 1] === 'string')
    args = arguments.splice(0, l - 2)
  else
    args = arguments
  if (!Array.prototype.isPrototypeOf(args[0]))
    return numeric.random(args)
  else
    return numeric.random(args[0])
}
_McLib.range = function (a, n, b) {
  if (arguments.length <= 1) {
    b = a || 0
    a = 0
  } else if (arguments.length === 2) {
    b = n
    n = 1
  }

  var adder = n < 0 ? -1 : 1
  var len = Math.max(Math.round((b - a + adder) / n), 1)
  var i = 0
  var range = new Array(len)
  while (i < len) {
    range[i++] = a
    a += n
  }
  return range
}

_McLib._gen = function (s, k, val) {
  var i
  var n = s[k]
  var ret = new Array(n)
  if (k === s.length - 1) {
    for (i = n - 1; i >= 1; i -= 2) {
      ret[i] = val
      ret[i - 1] = val
    }
    if (i === 0) { ret[0] = val }
    return ret
  }
  for (i = n - 1; i >= 0; i--) ret[i] = _McLib._gen(s, k + 1, val)
  return ret
}

_McLib.gen = function (s, val) {
  return _McLib._gen(s, 0, val)
}

_McLib.zeros = function () {
  return _McLib.gen(arguments, 0)
}
_McLib.ones = function () {
  return _McLib.gen(arguments, 1)
}
_McLib.horzcat = function () {
  var n = []
  for (var i in arguments)
    n = n.concat(arguments[i])
  return n
}
_McLib.vertcat = function () {
  var args = arguments
  var length = arguments.length
  var results = new Array(length)
  for (var i = 0; i < length; i++) {
    results[i] = _McLib.pluck(args, '' + i)
  }
  return results
}
_McLib.pluck = function (obj, key) {
  return _McLib.map(obj, function (value) { return value[key]})
}
_McLib.map = function (obj, iterator, context) {
  var results = []
  if (obj == null) return results
  _McLib.each(obj, function (value, index, list) {
    results[results.length] = iterator.call(context, value, index, list)
  })
  return results
}

_McLib.each = function (obj, iterator, context) {
  if (obj == null) return
  for (var i = 0, l = obj.length; i < l; i++) {
    if (iterator.call(context, obj[i], i, obj) === {}) return
  }
}

_McLib.length = function (x, dim) {
  var l = []
  if (arguments.length > 1) {
    while (dim !== 1) {
      l = x.length
      x = x[0]
    }
  } else {
    while (Object.prototype.toString.call(x) === '[object Array]') {
      l.push(x.length)
      x = x[0]
    }
  }
  return _McLib.max(l)
}
_McLib.average = function (array) {
  return numeric.sum(array) / array.length
}
_McLib.max = function (array) {
  return Math.max.apply(Math, array)
}
_McLib.min = function (array) {
  return Math.min.apply(Math, array)
}
*/

_McLib.stdlib = {
  'disp': function (s) { console.log(s.toString()) },
  'ones': _McLib.ones,
  'zeros': _McLib.zeros,
  'length': _McLib.length,
  'mtimes': _McLib.mtimes,
  'plus': _McLib.plus,
  'minus': _McLib.minus,
  'mrdivide': _McLib.mrdivide,
  'mod': _McLib.mod,
  'gt': _McLib.gt,
  'ge': _McLib.ge,
  'le': _McLib.le,
  'lt': _McLib.lt,
  'eq': _McLib.eq,
  'ne': _McLib.ne,
  'tic': _McLib.tic,
  'toc': _McLib.toc,
  'randn': _McLib.random,
  'rand': _McLib.random,
  'sqrt': _McLib.sqrt,
  'error': function (s) { 
    throw new Error(s)
  },
  'exit': function (n) {
      if (typeof process !== 'undefined' && process.hasOwnProperty('exit')) {
        process.exit(n)
      } else {
        if (n !== 0) {
          console.log('raising exception for non-zero exit')
          throw new Error('Exiting with error status :' + n)
        }
      }
  }
}

for (var k in _McLib.stdlib) {
    _McLib.stdlib[k] = matlab.Function(_McLib.stdlib[k])
}

if (typeof exports !== 'undefined') {
  for (var p in _McLib) {
    exports[p] = _McLib[p]
  }
}
