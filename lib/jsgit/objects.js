
JsGit.objects = {
  Blob: function(sha, content) {
    this.type = "blob"
    this.sha = sha
    this.content = content
  },
  
  Tree: function(sha, content) {
    this.type = "tree"
    this.sha = sha
    this.content = content
  },
  
  Commit: function(sha, content) {
    this.type = "commit"
    this.sha = sha
    this.content = content
    
    var lines = content.split("\n")
    this.tree = lines[0].split(" ")[1]
    var i = 1
    this.parents = []
    while (lines[i].slice(0, 6) == "parent") {
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
  
  Tag: function(sha, content) {
    this.type = "tag"
    this.sha = sha
    this.content = content
  }
}

