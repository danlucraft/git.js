var BinaryFile = require('../binary_file')
  , Remote = require('./remote')
  , Pack = require('./pack')
  , PackIndex = require('./pack_index')
  , utils = require('./utils')
  , _ = require('underscore')
  , inflate = require('./zlib').inflate
  , Objects = require('./objects')
  , http = require('./http')

var HttpRemote = function(repo, name, repoUrl) {
  Remote.call(this, repo, name, repoUrl)
}
HttpRemote.prototype = new Remote('','','')

HttpRemote.prototype.fetchRefs = function(callback) {
  var remote = this
  http.get(
    this.makeUri('/info/refs'),
    function(err, data) {
      var refs = HttpRemote.parseInfoRefs(data)
      _(refs).each(function(ref) {
        remote.addRef(ref.name, ref.sha)
      })
      if (callback !== undefined) {
        callback(null, refs)
      }
    }
  )
}

HttpRemote.prototype.getObject = function(sha, callback) {
  if (sha == "" || !sha) { return callback(null) }
  var remote = this

  var object = this.getObjectFromCachedPacks(sha, function(err, object) {
    if(err) return callback(err);
    if(object) return callback(null, object);
    remote.fetchObjectLoose(sha, function(err, object) {
      if (object) {
        callback(null, object)
      } else {
        remote.fetchObjectPacked(sha, callback)
      }
    })
  })
}

/**
 * Tries to find the object in a packfile that has already been cached.
 *
 * Will call ready exactly once:
 * ready(null, obj) if object was found in an already fetched pack files.
 * ready(err) if the object was found but couldn't be parsed.
 * ready(null, null) if object was not in one of the already fetched pack files.
 */
HttpRemote.prototype.getObjectFromCachedPacks = function(sha, ready) {
  var remote = this
  var found = false;
  if (this.packs) {
    _(_(this.packs).keys()).each(function(packSha) {
      if (found) return;
      var packInfo = remote.packs[packSha]
      if (packInfo.index && packInfo.pack) {
        var offset = packInfo.index.getOffset(sha)
        if (offset) {
          found = true;
          packInfo.pack.getObjectAtOffset(offset, ready);
        }
      }
    });
  }
  if (!found)
    ready()
}

HttpRemote.prototype.fetchObjectLoose = function(sha, callback) {
  var uri = this.makeObjectUri(sha)
  http.get(uri, function(err, data) {
    err ? callback(err) : HttpRemote.parseObjectData(sha, data, function(err, data) {
      callback(null, data);
    });
  })
}

HttpRemote.prototype.fetchObjectPacked = function(sha, callback) {
  var remote = this
  this.fetchPackList(function(err, packs) {
    if(err) return callback(err);

    var expecting = 0;
    _(_(packs).keys()).each(function(packSha) {
      remote.fetchPackIndex(packSha, function(err, packIndex) {
        var offset = packIndex.getOffset(sha)
        if (offset) {
          ++expecting;
          remote.fetchPackFile(packSha, function(err, packFile) {
            packFile.getObjectAtOffset(offset, function(err, data) {
              callback(err, data)
            })
          })
        }
      })
    })

  })
}

HttpRemote.prototype.fetchPackList = function(callback) {
  var remote = this
  if (remote.packs) {
    callback(null, remote.packs)
  } else {
    var uri = this.makeUri("/objects/info/packs")
    http.get(uri,  function(err, data) {
        if(err) return callback(err);

        remote.packs = {}
        _(HttpRemote.parsePackList(data)).each(function(packSha) {
          remote.packs[packSha] = {index: null, pack: null}
        })
        callback(null, remote.packs)
    })
  }
}

HttpRemote.prototype.fetchPackIndex = function(sha, callback) {
  if (this.packs && this.packs[sha] && this.packs[sha].index) {
    callback(null, this.packs[sha].index)
  } else {
    var uri = this.makeUri("/objects/pack/pack-" + sha + ".idx")
    var remote = this

    http.get(uri, function(err, data) {
        if(!err) {
          var packIndex = new PackIndex(data)
          remote.packs[sha].index = packIndex
          callback(null, packIndex)
        } else callback(err)
    })
  }
}

HttpRemote.prototype.fetchPackFile = function(sha, callback) {
  if (this.packs && this.packs[sha] && this.packs[sha].pack) {
    callback(null, this.packs[sha].pack)
  } else {
    var uri = this.makeUri("/objects/pack/pack-" + sha + ".pack")
    var remote = this
    http.get(uri, function(err, data) {
        if(err) return callback(err);
        var packFile = new Pack(data)
        remote.packs[sha].pack = packFile
        callback(null, packFile)
    })
  }
}

HttpRemote.prototype.makeObjectUri = function(sha) {
  return this.makeUri("/objects/" + sha.slice(0, 2) + "/" + sha.slice(2))
}


// Parses the contents of the .git/info/refs file
HttpRemote.parseInfoRefs = function(data) {
  var lines = data.split("\n")
  var refs = []
  _(lines).each(function(line) {
    if (line !== "") {
      var tabStops = line.split("\t")
      var ref = {name: tabStops[1], sha: tabStops[0]}
      refs.push(ref)
    }
  })
  return refs
}

HttpRemote.parsePackList = function(data) {
  var lines = data.split("\n")
  var packs = []
  _(lines).each(function(line) {
    if (line !== "") {
      var packSha = /pack-(.*)\.pack/.exec(line)[1]
      packs.push(packSha)
    }
  })
  return packs
}

HttpRemote.parseObjectData = function(sha, compressedData, ready) {
  inflate(compressedData, 2, function(err, data) {
    var offset = 0
    
    var peek = function(length) {
      return data.slice(offset, offset + length)
    }
    
    var rest = function() {
      return data.slice(offset)
    }
    
    var advance = function(length) {
      offset += length
    }
    
    var type = peek(3)
    advance(3)
    if (type === "com") {
      type = "commit"
      advance(4)
    } else if (type === "blo") {
      type = "blob"
      advance(2)
    } else if (type === "tre") {
      type = "tree"
      advance(2)
    } else {

      throw new Error("can't determine type of object: "+type+" "+data)
    }
    
    var nextByte = -1
    while (nextByte !== 0) {
      nextByte = peek(1).charCodeAt(0)
      advance(1)
    }
    ready(null, Objects.make(sha, type, rest()))
  });
}

module.exports = exports = HttpRemote
