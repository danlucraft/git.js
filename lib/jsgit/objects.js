
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
  },
  
  Tag: function(sha, content) {
    this.type = "tag"
    this.sha = sha
    this.content = content
  }
}

