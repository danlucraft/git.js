var utils = {}

utils.OBJECT_TYPES  = ["tag", "commit", "tree", "blob"]
utils.REMOTE_TYPE   = 'HttpRemote'

utils.handleError = typeof console !== 'undefined' ?
    function() { console.log.apply(console, arguments) } :
    function() { (this._logs || []).push([].slice.call(arguments)) }

// Turn an array of bytes into a String
utils.bytesToString = function(bytes) {
    var result = [];
    var i;
    for (i = 0; i < bytes.length; i++) {
      result.push(String.fromCharCode(bytes[i]));
    }
    return result.join('');
};

utils.stringToBytes = function(string) {
    var bytes = []; 
    var i; 
    for(i = 0; i < string.length; i++) {
      bytes.push(string.charCodeAt(i) & 0xff);
    }
    return bytes;
};

utils.toBinaryString = function(binary) {
  return (binary instanceof Array) ?
          this.bytesToString(binary) :
          binary
};

utils.nextPktLine = function(data) {
  var len = parseInt(data.slice(0, 4), 16);
  return data.slice(4, len);
};
 
utils.stripZlibHeader = function(zlib) {
  return zlib.slice(2);
}
 
utils.escapeHTML = function(str) {
    return str.replace(/\&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
               replace(/'/g, '&#39;');
};

module.exports = exports = utils
