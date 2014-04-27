function printString(s) {
    if (typeof console !== "undefined") {
        console.log(s);
    } else {
        print(s);
    }
}
var n = 10000;
var A1 = _McLib.random(n); 
var A2 = _McLib.clone(A1);

var start = performance.now();
A1 = bubble(A1);
printString("McVMJS time: " + (performance.now() - start));

var start = performance.now();
A2 = bubbleJS(A2);
printString("Chrome JS time: " + (performance.now() - start));

for (var i = 0; i < A1.length; ++i) {
    if (A1[i] !== A2[i]) {
        throw new Error("A1 and A2 do not have the same value at index: " + i);
    }
}
