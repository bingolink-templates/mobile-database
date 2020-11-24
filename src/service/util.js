module.exports = {
  each(arr, callback) {
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      callback(arr[i]);
    }
  }
}