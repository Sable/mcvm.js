var n = 10000;
var A1 = _McLib.random(n); 
var A2 = _McLib.clone(A1);

var start = performance.now();
bubble(A1);
console.log("McVMJS time: " + (performance.now() - start));

var start = performance.now();
bubbleJS(A2);
console.log("Chrome JS time: " + (performance.now() - start));

for (var i = 0; i < A1.length; ++i) {
    if (A1[i] !== A2[i]) {
        throw new Error("A1 and A2 do not have the same value at index: " + i);
    }
}
