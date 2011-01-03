
JsGit.Remote = function(repo, name, url) {
  var that = {}
  that.repo = repo
  that.name = name
  that.url = url
  that.refs = {}
  
  that.fetchRefs = function(callback) {
    $.get(
      url + '/info/refs?service=git-upload-pack',
      "",
      function(data) {
        var discInfo = JsGit.Remote.parseDiscovery(data)
        var i, ref
        for (i = 0; i < discInfo.refs.length; i++) {
          ref = discInfo.refs[i]
          that.addRef(ref.name, ref.sha)
        }
        if (callback != "undefined") {
          callback(discInfo.refs)
        }
      }
    )
  }
  
  that.fetchRef = function(wantRef, callback) {
    var url = that.url + '/git-upload-pack'
    var body = JsGit.Remote.refWantRequest(wantRef, repo.haveRefs(repo.getAllRefs()))
    $.ajax({
      url: url,
      data: body,
      type: "POST",
      contentType: "application/x-git-upload-pack-request",
      beforeSend: function(xhr) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined')
      },
      success: function(data, textStatus, xhr) {
        var binaryData = xhr.responseText
        var parser = new JsGit.UploadPackParser(binaryData)
        parser.parse()
        var objectDatas = parser.getObjects()
        var i, object
        var newObjects = []
        for (i = 0; i < objectDatas.length; i++) {
          object = objectDatas[i]
          newObjects.push(that.repo.addObject(object.sha, object.type, object.data))
        }
        if (callback != "undefined") {
          callback(parser.getRemoteLines(), newObjects)
        }
      },
      error: function(xhr, data, e) {
        JsGit.displayError("ERROR Status: " + xhr.status + ", response: " + xhr.responseText)
      }
    });
  }
  
  // Add a ref to this remote. fullName is of the form:
  //   refs/heads/master or refs/tags/123
  that.addRef = function(fullName, sha) {
    var type, name
    if (fullName.slice(0, 5) == "refs/") {
      type = fullName.split("/")[1]
      name = that.name + "/" + fullName.split("/")[2]
    }
    else {
      type = "HEAD"
      name = that.name + "/" + "HEAD"
    }
    that.refs[name] = {name:name, sha:sha, remote:that, type:type}
  }
  
  that.getRefs = function() {
    return _(that.refs).values()
  }
  
  that.getRef = function(name) {
    return that.refs[that.name + "/" + name]
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

// Constructs the body of a request to /git-upload-pack, specifying a ref
// we want and a bunch of refs we have.
//
// Returns a String
JsGit.Remote.refWantRequest = function(wantRef, haveRefs) {
  var str = "0067want " + wantRef.sha + " multi_ack_detailed side-band-64k thin-pack ofs-delta\n0000"
  _(haveRefs).each(function(haveRef) {
    str += "0032have " + haveRef.sha + "\n"
  })
  str += "0009done\n"
  return str
}
  