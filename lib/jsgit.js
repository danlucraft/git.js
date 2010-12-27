
JsGit = {
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
  },
  
  demo: function(username, reponame, password) {
    try {
      var repo = new JsGit.GithubProxyRepo(username, reponame, password)
      var origin = repo.getRemotes()["origin"]
      origin.fetchRefs(function(refs) {
        var i, ref
        for (i = 0; i < refs.length; i++) {
          ref = refs[i]
          $("#refs").append("<li>" + ref["name"] + ":" + ref["sha"] + "</li>")
        }
        origin.fetchRef(repo.getRefs()["refs/heads/master"], function(remoteLines, objects) {
          console.log("callback remoteLines: " + remoteLines)
          console.log("callback objects: " + objects)
          var i;
          for(i = 0; i < remoteLines.length; i++ ) {
            $('#response2').append("<br />" + remoteLines[i]);
          }
          for (i = 0; i < objects.length; i++) {
            $("#objects").append("<li>" + objects[i].sha + "<br /><pre>" + objects[i].data + "</pre></li>")
          }
        })
      })
    } catch (e) {
      console.log(e)
    }
  }
}