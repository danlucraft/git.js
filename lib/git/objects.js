
Git.objects = {
  CONSTRUCTOR_NAMES:{
    "blob": "Blob", 
    "tree": "Tree", 
    "commit": "Commit", "comm": "Commit",
    "tag": "Tag", "tag ": "Tag"
  },
  
  make: function(sha, type, content) {
    var constructor = Git.objects[this.CONSTRUCTOR_NAMES[type]]
    if (constructor) {
      return new constructor(sha, content)
    } else {
      throw("no constructor for " + type)
    }
  },
  
  Blob: function(sha, data) {
    this.type = "blob"
    this.sha = sha
    this.data = data
    this.toString = function() {
      return data
    }
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
        return Git.bytesToString(bytes)
      }
      else {
        return false
      }
    }
    
    var matchMode = function() {
      var first = collectUntil(Git.stringToBytes(" ")[0])
      if (!first) return null
      if (first != "100644" && first != "40000") {
        first = collectUntil(Git.stringToBytes(" ")[0])
      }
      return first
    }
    
    var matchName = function() {
      return collectUntil(0)
    }
    
    var matchObject = function() {
      var mode = matchMode()
      if (!mode) return false
      mode = mode.rjust(6, "0")
      var name = matchName()
      var shaBytes = peek(20)
      advance(20)
      var sha = _(shaBytes).map(function(b) { return b.toString(16).rjust(2, "0")}).join("")
      var type = (mode.slice(0, 3) === "100" ? "blob" : "tree")
      return {mode: mode, name: name, sha: sha, type: type}
    }
    
    var newObject
    this.contents = []
    while (nextObject = matchObject()) {
      this.contents.push(nextObject)
    }
    
    this.toString = function() {
      var str = "tree " + sha + "\n"
      str += "\n"
      this.contents.forEach(function(e) {
        str += e.name + (e.type == "tree" ? "/" : "") + "\n"
      })
      return str
    }
    
    this.id = function() {
      return {type: this.type, sha: this.sha, data: this.data, contents:this.contents}
    }
    
    this.asHash = function(tree) {
      var result = {}
      _(this.contents).each(function(entry) {
        result[entry.name] = entry
      })
      return result
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
    
    var parseAuthor = function(line) {
      var match = /^(.*) <(.*)> (\d+) \+\d\d\d\d$/.exec(line)
      var result = {}
      
      result.name = match[1]
      result.email = match[2]
      result.timestamp = parseInt(match[3])
      result.date = new Date(result.timestamp*1000)
      return result
    }
    
    var authorLine = lines[i].replace("author ", "")
    this.author = parseAuthor(authorLine)
    
    var committerLine = lines[i + 1].replace("committer ", "")
    this.committer = parseAuthor(committerLine)
    
    if (lines[i + 2].split(" ")[0] == "encoding") {
      this.encoding = lines[i + 2].split(" ")[1]
    }
    this.message = _(lines.slice(i + 2, lines.length)).select(function(line) { return line !== ""}).join("\n")
    
    this.toString = function() {
      var str = "commit " + sha + "\n"
      str += "Author: " + this.author.name + " <" + this.author.email + ">\n"
      str += "Date:   " + this.author.date +"\n"
      str += "\n"
      str += this.message
      return str
    }
  },
  
  Tag: function(sha, data) {
    this.type = "tag"
    this.sha = sha
    this.data = data
  }
}

