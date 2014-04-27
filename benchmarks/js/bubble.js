function bubbleJS(A) {
    var n = A.length;
    for (var j = 0; j < n-1; ++j) {
        for (var i = 0; i < n-1; ++i) {
            if (A[i] > A[i+1]) {
                var temp = A[i];
                A[i] = A[i+1];
                A[i+1] = temp;
            }
        }
    }
    return A;
}
