// Taken from Sujay Kathrotia COMP-621 project
var numeric = require("./numeric");

function clone(obj)
 { var clone = {};
   clone.prototype = obj.prototype;
   for (var property in obj) clone[property] = obj[property];
   return clone;
 }

var _McLib = clone(numeric);

_McLib.ceil = function(x) {
    return numeric.ceil([x])[0];
}
_McLib.sqrt = function(x) {
    return numeric.ceil([x])[0];
}
_McLib.cos = function(x) {
    return numeric.cos([x])[0];
}
_McLib.sin = function(x) {
    return numeric.sin([x])[0];
}
_McLib.exp = function(x) {
    return numeric.exp([x])[0];
}
_McLib.log = function(x) {
    return numeric.log([x])[0];
}
_McLib.abs = function(x) {
    return numeric.abs([x])[0];
}
_McLib.pow = function(x, y) {
    if(Object.prototype.toString.call(x) != "[object Array]")
        return numeric.pow([x], y)[0];
    else
        return numeric.pow(x,y);
}
_McLib.random = function(x, y) {
    var l = arguments.length;
    var args = [];
    if(arguments > 1 && Object.prototype.toString.call(arguments[l-1]) == "[object String]")
        args = arguments.splice(0,l-2);
    else
        args = arguments;
    if(Object.prototype.toString.call(args[0]) != "[object Array]")
        return numeric.random(args);
    else
        return numeric.random(args[0]);
}
_McLib.range = function (a,n,b) {
    if (arguments.length <= 1) {
        b = a || 0;
        a = 0;
    } else if (arguments.length == 2) {
        b = n;
        n = 1;
    }

    var adder = n < 0 ? -1 : 1;
    var len = Math.max(Math.round((b-a+adder)/n), 1);
    var i=0,range = new Array(len);
    while(i < len) {
        range[i++] = a;
        a += n;
    }
    return range;
}

_McLib._gen = function (s, k, val) {
    var i,n=s[k],ret=new Array(n);
    if(k === s.length-1) {
        for(i=n-1;i>=1;i-=2) {
            ret[i]=val;
            ret[i-1]=val;
        }
        if(i===0) { ret[0]=val; }
        return ret;
    }
    for(i=n-1;i>=0;i--) ret[i] = _McLib._gen(s, k+1, val);
    return ret;
}

_McLib.gen = function (s, val) {
    return _McLib._gen(s, 0, val);
}

_McLib.zeros = function () {
    return _McLib.gen(arguments, 0);
}
_McLib.ones = function () {
    return _McLib.gen(arguments, 1);
}
_McLib.horzcat = function () {
    var n = [];
    for(var i in arguments)
        n = n.concat(arguments[i]);
    return n;
}
_McLib.vertcat = function () {
    var args = arguments;
    var length = arguments.length;
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _McLib.pluck(args, "" + i);
    }
    return results;
}
_McLib.pluck = function (obj, key) {
    return _McLib.map(obj, function(value){ return value[key]; });
}
_McLib.map = function (obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    _McLib.each(obj, function(value, index, list) {
        results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
}

_McLib.each = function (obj, iterator, context) {
    if (obj == null) return;
    for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === {}) return;
    }
}

_McLib.length = function (x, dim) {
    var l = [];
    if(arguments.length > 1) {
        while(dim != 1) {
            l = x.length;
            x = x[0];
        }
    } else {
        while(Object.prototype.toString.call(x) == "[object Array]") {
            l.push(x.length);
            x = x[0];
        }
    }
    return l;
}
_McLib.average = function(array) {
   return numeric.sum(array)/array.length;
}
_McLib.max = function(array) {
    return Math.max.apply( Math, array );
}
_McLib.min = function(array) {
    return Math.min.apply( Math, array );
};

for (var p in _McLib) {
    exports[p] = _McLib[p];
}
