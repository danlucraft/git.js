
JsGit.Repo = function() {
}

JsGit.GithubProxyRepo = function(username, reponame, password) {
  this.username = username
  this.reponame = reponame
  this.password = password
}

JsGit.GithubProxyRepo.prototype = (function() {
  var refs = []
  var that = {}  
  
  that.getUrl = function() {
    return "http://localhost:3000/github/" + this.username + ":" + encodeURI(this.password) + "/" + this.reponame + ".git"
  }
  
  that.getRefs = function() {
    return _(refs).clone()
  }
  
  that.addRef = function(name, sha) {
    refs.push({name:name, sha:sha})
  }
  
  return that
}())