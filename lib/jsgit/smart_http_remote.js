
JsGit.SmartHttpRemote = function(repo, name, repoUrl) {
  JsGit.Remote.apply(this, [repo, name, repoUrl])
  
  this.fetchRefs = function(callback) {
    var remote = this
    $.get(
      this.makeUri('/info/refs', {service: "git-upload-pack"}),
      "",
      function(data) {
        var discInfo = JsGit.SmartHttpRemote.parseDiscovery(data)
        var i, ref
        for (i = 0; i < discInfo.refs.length; i++) {
          ref = discInfo.refs[i]
          remote.addRef(ref.name, ref.sha)
        }
        if (callback != "undefined") {
          callback(discInfo.refs)
        }
      }
    )
  }
}

// Parses the response to /info/refs?service=git-upload-pack, which contains ids for
// refs/heads and a capability listing for this git HTTP server.
//
// Returns {capabilities:"...", refs: [{name:"...", sha:"..."}, ...]}
JsGit.SmartHttpRemote.parseDiscovery = function(data) {
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

// Constructs the body of a request to /git-upload-pack, specifying a ref
// we want and a bunch of refs we have.
//
// Returns a String
JsGit.SmartHttpRemote.refWantRequest = function(wantRef, haveRefs) {
  var str = "0067want " + wantRef.sha + " multi_ack_detailed side-band-64k thin-pack ofs-delta\n0000"
  _(haveRefs).each(function(haveRef) {
    str += "0032have " + haveRef.sha + "\n"
  })
  str += "0009done\n"
  return str
}



