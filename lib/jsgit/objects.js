
JsGit.objects = {
  CONSTRUCTOR_NAMES:{"blob": "Blob", "tree": "Tree", "commit": "Commit", "tag": "Tag"},
  
  make: function(sha, type, content) {
    var constructor = JsGit.objects[this.CONSTRUCTOR_NAMES[type]]
    return new constructor(sha, content)
  },
  
  Blob: function(sha, data) {
    this.type = "blob"
    this.sha = sha
    this.data = data
  },
  
  Tree: function(sha, data) {
    this.type = "tree"
    this.sha = sha
    this.data = data
    
    data = new BinaryFile(data)
    offset = 0
    
    var peek = function(length) {
      return data.slice(offset, offset + length)
    }
    
    var advance = function(length) {
      offset += length
    }
  
    var collectUntil = function(byte) {
      var bytes = []
      var nextByte = peek(1)[0]
      while (nextByte != 0 && nextByte != byte) {
        bytes.push(peek(1)[0])
        advance(1)
        nextByte = peek(1)[0]
      }
      advance(1)
      if (bytes.length > 0) {
        return JsGit.bytesToString(bytes)
      }
      else {
        return false
      }
    }
    
    var matchMode = function() {
      return collectUntil(JsGit.stringToBytes(" ")[0])
    }
    
    var matchName = function() {
      return collectUntil(0)
    }
    
    var matchObject = function() {
      var mode = matchMode()
      if (!mode) return false
      var name = matchName()
      var shaBytes = peek(20)
      advance(20)
      var sha = _(shaBytes).map(function(b) { return b.toString(16).rjust(2, "0")}).join("")
      return {mode: mode.rjust(6, "0"), name: name, sha: sha}
    }
    
    var newObject
    this.contents = []
    while (nextObject = matchObject()) {
      this.contents.push(nextObject)
    }
  },
  
  Commit: function(sha, data) {
    this.type = "commit"
    this.sha = sha
    this.data = data
    
    var lines = data.split("\n")
    this.tree = lines[0].split(" ")[1]
    var i = 1
    this.parents = []
    while (lines[i].slice(0, 6) === "parent") {
      this.parents.push(lines[i].split(" ")[1])
      i += 1
    }
    
    this.author = lines[i].replace("author ", "")
    this.committer = lines[i + 1].replace("committer ", "")
    if (lines[i + 2].split(" ")[0] == "encoding") {
      this.encoding = lines[i + 2].split(" ")[1]
    }
    this.message = _(lines.slice(i + 2, lines.length)).select(function(line) { return line !== ""}).join("\n")
  },
  
  Tag: function(sha, data) {
    this.type = "tag"
    this.sha = sha
    this.data = data
  }
}

