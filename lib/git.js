
/* Main object */
Git = {
  OBJECT_TYPES: ["tag", "commit", "tree", "blob"],
  REMOTE_TYPE: "HttpRemote",
  
  // Print an error either to the console if in node, or to div#jsgit-errors
  // if in the client.
  handleError: function(message) {
    if (jsGitInNode) {
      console.log(message)
    }
    else {
      $('#jsgit-errors').append(message)
    }
  },
  
  // Turn an array of bytes into a String
  bytesToString: function(bytes) {
    var result = "";
    var i;
    for (i = 0; i < bytes.length; i++) {
      result = result.concat(String.fromCharCode(bytes[i]));
    }
    return result;
  },
  
  stringToBytes: function(string) {
    var bytes = []; 
    var i; 
    for(i = 0; i < string.length; i++) {
      bytes.push(string.charCodeAt(i) & 0xff);
    }
    return bytes;
  },
    
  toBinaryString: function(binary) {
    if (Array.isArray(binary)) {
      return Git.bytesToString(binary)
    }
    else {
      return binary
    }
  },
    
  // returns the next pkt-line
  nextPktLine: function(data) {
    var length = parseInt(data.substring(0, 4), 16);
    return data.substring(4, length);
  },
  
  // zlib files contain a two byte header. (RFC 1950)
  stripZlibHeader: function(zlib) {
    return zlib.slice(2)
  },
  
  escapeHTML: function(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

