
JsGit.HttpRemote = function(repo, name, repoUrl) {
  JsGit.Remote.apply(this, [repo, name, repoUrl])
  this.packs = {}

  this.fetchRefs = function(callback) {
    var remote = this
    $.get(
      this.makeUri('/info/refs'),
      "",
      function(data) {
        var refs = JsGit.HttpRemote.parseInfoRefs(data)
        _(refs).each(function(ref) {
          remote.addRef(ref.name, ref.sha)
        })
        if (callback != "undefined") {
          callback(refs)
        }
      }
    )
  }
  
  this.fetchObject = function(sha, callback) {
    this.fetchObjectData(sha, function(data) {
      var object = JsGit.HttpRemote.parseObjectData(sha, data)
      console.log(object)
      callback(object)
    })
  }
  
  this.fetchObjectData = function(sha, callback) {
    console.log(sha)
    var remote = this
    this.fetchObjectDataLoose(sha, function(data) {
      if (data) { 
        callback(data) 
      } else {
        remote.fetchObjectDataPacked(sha, function(data) {
          
        })
      }
    })
  }
  
  this.fetchObjectDataLoose = function(sha, callback) {
    var uri = this.makeObjectUri(sha)
    $.ajax({
      url: uri,
      type: "GET",
      beforeSend: function(xhr, settings) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined')
      },
      success: function(data) {
        callback(data)
      },
      error: function(xhr) {
        callback(null)
      }
    })
  }
  
  this.fetchObjectDataPacked = function(sha, callback) {
    var remote = this
    this.fetchPackList(function(packs) {
      _(packs).each(function(packSha) {
        remote.fetchPackIndex(packSha, function(packIndex) {
          console.log(packIndex.numObjects())
          console.log(packIndex.estimatedPackFileSize())
        })
      })
    })
  }
  
  this.fetchPackList = function(callback) {
    var uri = this.makeUri("/objects/info/packs")
    $.ajax({
      url: uri, type: "GET", 
      success: function(data) {
        var packs = JsGit.HttpRemote.parsePackList(data)
        callback(packs)
      }
    })
  }
  
  this.fetchPackIndex = function(sha, callback) {
    var uri = this.makeUri("/objects/pack/pack-" + sha + ".idx")
    $.ajax({
      url: uri, type: "GET", 
      beforeSend: function(xhr, settings) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined')
      },
      success: function(data) {
        callback(new JsGit.PackIndex(data))
      }
    })
  }
  
  this.makeObjectUri = function(sha) {
    return this.makeUri("/objects/" + sha.slice(0, 2) + "/" + sha.slice(2))
  }
}

// Parses the contents of the .git/info/refs file
JsGit.HttpRemote.parseInfoRefs = function(data) {
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

JsGit.HttpRemote.parsePackList = function(data) {
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

JsGit.HttpRemote.parseObjectData = function(sha, compressedData) {
  var deflated = JsGit.stripZlibHeader(JsGit.stringToBytes(compressedData))
  var data = new BinaryFile(RawDeflate.inflate(JsGit.bytesToString(deflated)).toString())
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
  
  var type = JsGit.bytesToString(peek(3))
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
  return JsGit.objects.make(sha, type, JsGit.bytesToString(rest()))
}








