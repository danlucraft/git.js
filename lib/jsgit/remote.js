
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
          callback(discInfo.refs)
        }
      }
    )
  }
  
  that.fetchRef = function(ref, callback) {
    var url = that.url + '/git-upload-pack'
    $.ajax({
      url: url,
      data: "0067want " + ref.sha + " multi_ack_detailed side-band-64k thin-pack ofs-delta\n00000009done\n",
      type: "POST",
      contentType: "application/x-git-upload-pack-request",
      beforeSend: function(xhr) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined')
      },
      success: function(data, textStatus, xhr) {
        var binaryData = xhr.responseText
        var parser = new JsGit.UploadPackParser(binaryData)
        parser.parse()
        if (callback != "undefined") {
          callback(parser.getRemoteLines(), parser.getObjects())
        }
      },
      error: function(xhr, data, e) {
        JsGit.displayError("ERROR Status: " + xhr.status + ", response: " + xhr.responseText)
      }
    });
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
