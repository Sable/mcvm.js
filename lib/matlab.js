var matlab = matlab || {}

Number.prototype.copy = function () {
  return Number(this)
}

Number.prototype.getSize = function () {
  return matlab.Array.fromJSArray([1, 1])
}

Number.prototype.forEach = function (f) {
  return f(Number(this), 1)
}

String.prototype.copy = function () {
  return String(this)
}

String.prototype.getSize = function () {
  throw new Error('Unimplemented getSize for string primitive')
}

String.prototype.forEach = function (f) {
  return f(this)
}

function arrayEquals (a1, a2, strict) {
  if (!a2) {
    return false
  }

  strict = strict === undefined

  if (a1.length !== a2.length) {
    return false
  }

  for (var i = 0; i < a1.length; i++) {
    if (a1[i] instanceof Array && a2[i] instanceof Array) {
      if (!arrayEquals(a1[i], a2[i], strict)) {
        return false
      }
    } else if (strict && a1[i] !== a2[i]) {
      return false
    } else if (!strict) {
      return arrayEquals(a1.sort(), a2.sort(), true)
    }
  }
  return true
}

function arrayCopy (a) {
  var c = []
  c.length = a.length
  for (var i = 0; i < a.length; ++i) {
    c[i] = a[i]
  }
  return c
}

function isFloat (n) {
  return n === +n && n !== (n | 0)
}

function isInteger (n) {
  return n === +n && n === (n | 0)
}

function matlabArrayGet (x, y, z) {
  var d1, d2
  if (z !== undefined) {
    throw new Error('Array.get: Unimplemented indexing with more than 2 dimensions')
  }

  if (y === undefined) {
    d2 = 0
  } else if (typeof y === 'number') {
    d2 = y - 1
  }

  if (x === undefined) {
    return this.copy()
  } else if (typeof x === 'number') {
    d1 = x - 1
  }

  if (x instanceof matlab.Array || y instanceof matlab.Array) {
    throw new Error('Array.get: Unimplemented logical indexing on arrays')
  }

  if (x instanceof matlab.Range || y instanceof matlab.Range) {
    throw new Error('Array.get: Unimplemented range indexing on arrays')
  }

  if (!isInteger(d1) || !isInteger(d2) ||
    d1 < 0 || d2 < 0) {
    throw new Error('Subscript indices must either be real positive integers or logicals.')
  }

  if (y === undefined) {
    if (x > this._size[0] * this._size[1]) {
      throw new Error('Index exceeds matrix dimensions.')
    }
  } else if (x > this._size[0] || y > this._size[1]) {
    throw new Error('Index exceeds matrix dimensions.')
  }

  return this._array[(d2 * this._size[0]) + d1]
}

function matlabArrayGet1 (x) {
  if (typeof x === 'number' &&
    isInteger(x) &&
    x > 0 &&
    x <= this._size[0] * this._size[1]) {
    return this._array[x - 1]
  } else {
    return this.get_1_slow(x)
  }
}
function flatten (a) {
  function traverse (a) {
    if (!Array.prototype.isPrototypeOf(a)) {
      a2.push(a)
    } else {
      for (var i = 0; i < a.length; ++i) {
        traverse(a[i])
      }
    }
  }
  var a2 = []
  traverse(a)
  return a2
}

matlab.Array = function (a, b, c) {
  if (!matlab.Array.prototype.isPrototypeOf(this)) {
    return new matlab.Array(a, b, c)
  }

  // Copy 'a' 
  if (matlab.Array.prototype.isPrototypeOf(a)) {
    this._array = new Float64Array(a._array)
    this._size = arrayCopy(a._size)
    return this
  }

  if (a === undefined) {
    a = 0
    b = 0
  }

  if (b === undefined) {
    b = a
    a = 1
  }

  if (c !== undefined) {
    throw new Error('matlab.Array: Unimplemented arrays with 3 or more dimensions')
  }

  this._array = new Float64Array(a * b)
  this._size = [a, b]
  return this
}
matlab.Array.prototype = {
  _array: new Float64Array(),
  equals: function (b) {
    if (b instanceof matlab.Array) {
      if (!arrayEquals(this._size, b._size)) {
        return false
      }

      for (var i = 0; i < this._array.length; ++i) {
        if (this._array[i] !== b._array[i]) {
          return false
        }
      }

      return true
    } else if (b instanceof matlab.Range) {
      if (!this.getSize().equals(b.getSize())) {
        return false
      }

      b.forEach(function (v, i) {
        if (v !== this.get(i)) {
          return false
        }
      })
      return true
    } else {
      throw new Error('matlab.Array.equals: Unimplemented for non-regular arrays')
    }
  },
  getSize: function () {
    return matlab.Array.fromJSArray(this._size)
  },
  resize: function (x, y) {
    throw new Error('Array.resize: Unimplemented operation')
  },
  call: matlabArrayGet,
  call_1: matlabArrayGet1,
  get: matlabArrayGet,
  get_1: matlabArrayGet1,
  get_1_slow: function (x) {
    if (!isInteger(x) || x <= 0) {
      throw new Error('Subscript indices must either be real positive integers or logicals.')
    }

    if (x > this._size[0] * this._size[1]) {
      throw new Error('Index exceeds matrix dimensions.')
    }

    throw new Error('Invalid get_1 case')
  },
  get_1_nbc: function (x) {
    var d1 = x - 1
    return this._array[d1]
  },
  get_2_nbc: function (x, y) {
    var d1 = x - 1
    var d2 = y - 1
    return this._array[(d2 * this._size[0]) + d1]
  },
  set: function (v, x, y, z) {
    if (v === undefined) {
      throw new Error('Array.set: Must specify a value to assign')
    }
    if (x === undefined) {
      throw new Error('Error: An indexing expression on the left side of an assignment must have at least one subscript.')
    }
    if (z !== undefined) {
      throw new Error('Array.set: Unimplemented 3-dimensional indexing parameters')
    }

    var d1, d2
    if (typeof x === 'number') {
      if (typeof v === 'number') {
        d1 = x - 1
        if (y === undefined) {
          d2 = 0
        } else {
          d2 = y - 1
        }
        this._array[(d2 * this._size[0]) + d1] = v
        return this
      } else {
        throw new Error(
          'In an assignment  A(:) = B, the number of elements in A and B must be the same.' +
          '\n v: ' + v +
          '\n x: ' + x)
      }
    } else if (x instanceof matlab.Range) {
      var that = this
      if (typeof v === 'number') {
        x.forEach(function (i) {
          that.set(v, i)
        })
      } else if (x.getSize() === v.getSize()) {
        x.forEach(function (i) {
          that.set(v.get(i), i)
        })
      } else {
        throw new Error('In an assignment  A(:) = B, the number of elements in A and B must be the same.')
      }
    } else {
      throw new Error('Array.set: Unimplemented assignment with Array index')
    }
    return this
  },
  set_1: function (v, x) {
    if (typeof x === 'number' &&
      isInteger(x) &&
      x > 0 &&
      x <= this._size[0] * this._size[1]) {
      this._array[x - 1] = v
      return this
    } else {
      return this.set_1_slow(v, x)
    }
  },
  set_1_slow: function (v, x) {
    throw new Error('Array.set_1: Invalid case')
  },
  set_1_nbc: function (v, x) {
    var d1 = x - 1
    this._array[d1] = v
  },
  copy: function () {
    return new matlab.Array(this)
  },
  forEach: function (cb) {
    if (typeof cb === 'function') {
      for (var i = 0; i < this._array.length; ++i) {
        cb(this._array[i], i + 1)
      }
    } else {
      throw new Error('Array.forEach: invalid forEach callback, expected a function')
    }
  },
  map: function (cb) {
    var newArray = this.copy()
    if (typeof cb === 'function') {
      for (var i = 0; i < this._array.length; ++i) {
        newArray.set(cb(this._array[i], i + 1), i + 1)
      }
    } else {
      throw new Error('Array.map: invalid forEach callback, expected a function')
    }
    return newArray
  },
  toString: function () {
    return 'array(' + this._size.join(',') + ')[' + this._array.join(',') + ']'
  }
}
matlab.Array.fromJSArray = function (jsArray, size) {
  if (size === undefined) {
    if (jsArray.length === 0) {
      size = [0, 0]
    } else {
      size = []
      var p = jsArray
      while (Array.prototype.isPrototypeOf(p)) {
        size.push(p.length)
        var first = p[0]
        if (Array.prototype.isPrototypeOf(first)) {
          p.forEach(function (x) {
            if (x.length !== first.length) {
              throw new Error('Dimensions of matrices being concatenated are not consistent.')
            }
          })
        }
        p = first
      }
    }
  } else if (!Array.prototype.isPrototypeOf(size)) {
    throw new Error('matlab.Array.fromJSArray: size should be an array')
  } else {
    var length = 1
    size.forEach(function (x) {
      length *= x
    })

    if (length !== jsArray.length) {
      throw new Error('matlab.Array.fromJSArray: size [' + size + '] should be the same as the number of elements of the JavaScript array (' + jsArray.length + ')')
    }
  }

  jsArray = flatten(jsArray)
  var a = Function.prototype.apply.call(matlab.Array, null, size)
  for (var i = 0; i < jsArray.length; ++i) {
    a.set(jsArray[i], i + 1)
  }
  return a
}

matlab.Range = function (first, last, step) {
  if (!matlab.Range.prototype.isPrototypeOf(this)) {
    return new matlab.Range(first, last, step)
  }

  if (matlab.Range.prototype.isPrototypeOf(first)) {
    var range = first
    this._first = range._first
    this._last = range._last
    this._step = range._step
    return this
  }

  this._first = first

  if (last === undefined &&
    typeof (last) !== 'number' &&
    last !== null) {
    throw new Error("Invalid Range, an upper limit should be specified using either a numerical value or 'end'(null)")
  }
  this._last = last
  if (step !== undefined &&
    typeof (step) !== 'number') {
    throw new Error('Invalid Range step, a numerical step (or no step) should be specified')
  }
  this._step = step || 1
}
matlab.Range.prototype = {
  equals: function (b) {
    if (b instanceof matlab.Range) {
      return b._first === this._first && b._last === this._last && b._step === this._step
    } else if (b instanceof matlab.Array) {
      if (!this.getSize().equals(b.getSize())) {
        return false
      }

      this.forEach(function (v, i) {
        if (v !== b.get(i)) {
          return false
        }
      })
      return true
    }
  },
  getSize: function () {
    var size = Math.ceil((Math.abs(this._last - this._first) + 1) / this._step)
    return matlab.Array.fromJSArray([1, size])
  },
  resize: function (x, y) {
    throw new Error('Range.resize: Unimplemented operation')
  },
  call: function (x, y) {
    return this.get(x, y)
  },
  get: function (x, y) {
    if (x >= 1 && y === undefined) {
      var v = this._step * (x - 1) + this._low
      if (v <= this._last) {
        return v
      } else {
        throw new Error('Index exceeds matrix dimensions.')
      }
    } else {
      throw new Error('Subscript indices must either be real positive integers or logicals.')
    }

    if (y !== undefined) {
      if (x > 1) {
        throw new Error('Index exceeds matrix dimensions.')
      } else {
        throw new Error('Range.get: Unimplemented multiple indexing parameters on Range')
      }
    }
  },
  set: function (v, x, y) {
    throw new Error('Range.set: Unimplemented multiple indexing parameters')
  },
  copy: function () {
    return new matlab.Range(this)
  },
  forEach: function (cb) {
    var v
    if (typeof cb === 'function') {
      var index = 1
      if (this._last >= this._first) {
        for (v = this._first; v <= this._last; v += this._step) {
          index += 1
          cb(v, index)
        }
      } else {
        for (v = this._first; v >= this._last; v += this._step) {
          index += 1
          cb(v, index)
        }
      }
    } else {
      throw new Error('Range.forEach: invalid forEach callback, expected a function')
    }
  },
  map: function (cb) {
    throw new Error('Unimplemented map operation for Ranges')
  }
}

matlab.Function = function (f) {
  for (var i = 0; i < 10; ++i) {
    f['call_' + i] = f
  }
  f.call = f
  return f
}

if (typeof exports !== 'undefined') {
  exports.Array = matlab.Array
  exports.Range = matlab.Range
  exports.Function = matlab.Function
}
