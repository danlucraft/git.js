
JsGit.HttpRemote = function(repo, name, repoUrl) {
  JsGit.Remote.apply(this, [repo, name, repoUrl])

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
  
  this.fetchHistory = function(sha, max, callback, haveCommits) {
    var commits = haveCommits || []
    if (max == 0) {
      callback(commits)
    } else {
      if (sha == "undefined") {
        callback(commits)
      } else {
        var remote = this;
        this.fetchObject(sha, function(commit) {
          commits.push(commit)
          remote.repo.addObject(commit)
          remote.fetchHistory(commit.parents[0], max-1, callback, commits)
        })
      }
    }
  }
  
  this.fetchObject = function(sha, callback) {
    this.fetchObjectData(sha, function(data) {
      var object = JsGit.HttpRemote.parseObjectData(sha, data)
      console.log(object)
      callback(object)
    })
  }
  
  this.fetchObjectData = function(sha, callback) {
    var uri = this.makeObjectUri(sha)
    $.ajax({
      url: uri,
      type: "GET",
      beforeSend: function(xhr) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined')
      },
      success: function(data) {
        callback(data)
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
  }
  
  var nextByte = -1
  while (nextByte !== 0) {
    nextByte = peek(1)[0]
    advance(1)
  }
  return JsGit.objects.make(sha, type, JsGit.bytesToString(rest()))
}








