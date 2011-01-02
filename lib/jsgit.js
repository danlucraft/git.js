
JsGit = {
  OBJECT_TYPES: ["tag", "commit", "tree", "blob"],
  
  handleError: function(message) {
    if (jsGitInNode) {
      console.log(message)
    }
    else {
      $('#response2').append(message)
    }
  },
  
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
      bytes.push(string.charCodeAt(i));
    }
    return bytes;
  },
    
  toBinaryString: function(binary) {
    if (Array.isArray(binary)) {
      return JsGit.bytesToString(binary)
    }
    else {
      return binary
    }
  },
    
  // returns the next pkt-line
  nextPktLine: function(data) {
    var length = parseInt(data.substring(0, 4), 16);
    return data.substring(4, length);
  }
}

