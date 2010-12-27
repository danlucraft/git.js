
JsGit.Remote = function(repo, name, url) {
  var that = {}
  that.repo = repo
  that.name = name
  that.url = url
  
  that.fetchRefs = function(callback) {
    $.get(
      url + '/info/refs?service=git-upload-pack',
      "",
      function(data) {
        var discInfo = JsGit.Remote.parseDiscovery(data)
        var i, ref
        for (i = 0; i < discInfo.refs.length; i++) {
          ref = discInfo.refs[i]
          that.repo.addRef(ref.name, ref.sha)
        }
        if (callback != "undefined") {
          console.log("fetchRefs: " + discInfo.refs)
          callback(discInfo.refs)
        }
      }
    )
  }
  
  return that
}

// Parses the response to /info/refs?service=git-upload-pack, which contains ids for
// refs/heads and a capability listing for this git HTTP server.
//
// Returns {capabilities:"...", refs: [{name:"...", sha:"..."}, ...]}
JsGit.Remote.parseDiscovery = function(data) {
  var lines = data.split("\n")
  var result = {"refs":[]}
  for ( i = 1; i < lines.length - 1; i++) {
    thisLine = lines[i]
    if (i == 1) {
      var bits = thisLine.split("\0")
      result["capabilities"] = bits[1]
      var bits2 = bits[0].split(" ")
      result["refs"].push({name:bits2[1], sha:bits2[0].substring(8)})
    }
    else {
      var bits2 = thisLine.split(" ")
      result["refs"].push({name:bits2[1], sha:bits2[0].substring(4)})
    }
  }
  return result
}
