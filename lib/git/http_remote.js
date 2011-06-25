
Git.HttpRemote = function(repo, name, repoUrl) {
  Git.Remote.apply(this, [repo, name, repoUrl])
  
  this.fetchRefs = function(callback) {
    var remote = this
    $.get(
      this.makeUri('/info/refs'),
      "",
      function(data) {
        var refs = Git.HttpRemote.parseInfoRefs(data)
        _(refs).each(function(ref) {
          remote.addRef(ref.name, ref.sha)
        })
        if (callback != "undefined") {
          callback(refs)
        }
      }
    )
  }
  
  this.getObject = function(sha, callback) {
    if (sha == "" || !sha) { return callback(null) }
    var remote = this
    var object = this.getObjectFromCachedPacks(sha)
    if (object) {
      return callback(object)
    }
    this.fetchObjectLoose(sha, function(object) {
      if (object) { 
        callback(object)
      } else {
        remote.fetchObjectPacked(sha, callback)
      }
    })
  }
  
  this.getObjectFromCachedPacks = function(sha) {
    var remote = this
    if (this.packs) {
      var foundObject = null
      _(_(this.packs).keys()).each(function(packSha) {
        var packInfo = remote.packs[packSha]
        if (packInfo.index && packInfo.pack) {
          var offset = packInfo.index.getOffset(sha)
          if (offset) {
            thisObject = packInfo.pack.getObjectAtOffset(offset)
            if (thisObject) {
              foundObject = thisObject
            }
          }
        }
      })
      if (foundObject) {
        return foundObject
      }
    }
  }
  
  this.fetchObjectLoose = function(sha, callback) {
    var uri = this.makeObjectUri(sha)
    $.ajax({
      url: uri,
      type: "GET",
      beforeSend: function(xhr, settings) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined')
      },
      success: function(data) {
        callback(Git.HttpRemote.parseObjectData(sha, data))
      },
      error: function(xhr) {
        callback(null)
      }
    })
  }
  
  this.fetchObjectPacked = function(sha, callback) {
    var remote = this
    this.fetchPackList(function(packs) {
      _(_(packs).keys()).each(function(packSha) {
        remote.fetchPackIndex(packSha, function(packIndex) {
          if (packIndex.getOffset(sha)) {
            var offset = packIndex.getOffset(sha)
            remote.fetchPackFile(packSha, function(packFile) {
              var object = packFile.getObjectAtOffset(offset)
              callback(object)
            })
          }
        })
      })
    })
  }
  
  this.fetchPackList = function(callback) {
    var remote = this
    if (remote.packs) {
      callback(remote.packs)
    } else {
      console.log("fetching pack list")
      var uri = this.makeUri("/objects/info/packs")
      $.ajax({
        url: uri, type: "GET", 
        success: function(data) {
          remote.packs = {}
          _(Git.HttpRemote.parsePackList(data)).each(function(packSha) {
            remote.packs[packSha] = {index: null, pack: null}
          })
          callback(remote.packs)
        }
      })
    }
  }
  
  this.fetchPackIndex = function(sha, callback) {
    if (this.packs && this.packs[sha] && this.packs[sha].index) {
      callback(this.packs[sha].index)
    } else {
      console.log("fetching pack index pack-" + sha + ".idx")
      var uri = this.makeUri("/objects/pack/pack-" + sha + ".idx")
      var remote = this
      $.ajax({
        url: uri, type: "GET", 
        beforeSend: function(xhr, settings) {
          xhr.overrideMimeType('text/plain; charset=x-user-defined')
        },
        success: function(data) {
          var packIndex = new Git.PackIndex(data)
          remote.packs[sha].index = packIndex
          callback(packIndex)
        }
      })
    }
  }
  
  this.fetchPackFile = function(sha, callback) {
    if (this.packs && this.packs[sha] && this.packs[sha].pack) {
      callback(this.packs[sha].pack)
    } else {
      console.log("fetching pack file pack-" + sha + ".pack")
      var uri = this.makeUri("/objects/pack/pack-" + sha + ".pack")
      var remote = this
      $.ajax({
        url: uri, type: "GET", 
        beforeSend: function(xhr, settings) {
          xhr.overrideMimeType('text/plain; charset=x-user-defined')
        },
        success: function(data) {
          var packFile = new Git.Pack(data)
          remote.packs[sha].pack = packFile
          callback(packFile)
        }
      })
    }
  }
  
  this.makeObjectUri = function(sha) {
    return this.makeUri("/objects/" + sha.slice(0, 2) + "/" + sha.slice(2))
  }
}

// Parses the contents of the .git/info/refs file
Git.HttpRemote.parseInfoRefs = function(data) {
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

Git.HttpRemote.parsePackList = function(data) {
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

Git.HttpRemote.parseObjectData = function(sha, compressedData) {
  var deflated = Git.stripZlibHeader(Git.stringToBytes(compressedData))
  var data = new BinaryFile(RawDeflate.inflate(Git.bytesToString(deflated)).toString())
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
  
  var type = Git.bytesToString(peek(3))
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
    throw(Error("can't determine type of object"))
  }
  
  var nextByte = -1
  while (nextByte !== 0) {
    nextByte = peek(1)[0]
    advance(1)
  }
  return Git.objects.make(sha, type, Git.bytesToString(rest()))
}








