var HttpRemote = require('./http_remote')
  , UploadPackParser = require('./upload_pack_parser')
  , utils = require('./utils')
  , _ = require('underscore')
  , http = require('./http')

var SmartHttpRemote = function(repo, name, repoUrl) {
  HttpRemote.call(this, repo, name, repoUrl)
}

SmartHttpRemote.prototype = new HttpRemote('','','')

SmartHttpRemote.prototype.toString = function() { return '<SmartHttpRemote: "'+this.makeUri()+'">'; }

SmartHttpRemote.prototype.fetchRefs = function(callback) {
  var remote = this
  http.get(
    this.makeUri('/info/refs', {service: "git-upload-pack"}),
    function(err, data) {
      var discInfo = SmartHttpRemote.parseDiscovery(data)
      var i, ref
      for (i = 0; i < discInfo.refs.length; i++) {
        ref = discInfo.refs[i]
        remote.addRef(ref.name, ref.sha)
      }
      if (callback !== undefined) {
        callback(discInfo.refs)
      }
    }
  )
}

SmartHttpRemote.prototype.fetchRef = function(wantRef, callback) {
  var url = this.makeUri('/git-upload-pack')
  var body = SmartHttpRemote.refWantRequest(wantRef, this.repo.haveRefs(this.repo.getAllRefs()))
  var thisRemote = this

  http.post(url, {
      'Content-Type'  : "application/x-git-upload-pack-request"
    , 'Accept'        : 'text/plain; charset=x-user-defined'
    , 'Content-Length': body.length
    , 'Accept'        : 'text/plain; charset=x-user-defined'
  }, function(err, data) {
      var binaryData = data
      var parser = new UploadPackParser(binaryData)
      parser.parse(function(err, packFile) {
        var objectDatas = parser.getObjects()
        if (!objectDatas) {
          return callback(err);
        }
        var i, object
        var newObjects = []
        for (i = 0; i < objectDatas.length; i++) {
          object = objectDatas[i]
          var newObject = thisRemote.repo.makeAndAddObject(object.sha, object.type, object.data)
          newObjects.push(newObject)
        }
        thisRemote.repo.getObject(wantRef.sha, callback);
          
          
      })
  }, body);
}



// Parses the response to /info/refs?service=git-upload-pack, which contains ids for
// refs/heads and a capability listing for this git HTTP server.
//
// Returns {capabilities:"...", refs: [{name:"...", sha:"..."}, ...]}
SmartHttpRemote.parseDiscovery = function(data) {
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
SmartHttpRemote.refWantRequest = function(wantRef, haveRefs) {
  var str = "0067want " + wantRef.sha + " multi_ack_detailed side-band-64k thin-pack ofs-delta\n0000"
  _(haveRefs).each(function(haveRef) {
    str += "0032have " + haveRef.sha + "\n"
  })
  str += "0009done\n"
  return str
}

module.exports = exports = SmartHttpRemote
