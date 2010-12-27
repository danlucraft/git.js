
JsGit.Repo = function() {
  var refs = {}
  var that = {}
  var remotes = {}
  
  that.getRefs = function() {
    return _(refs).clone()
  }
  
  that.addRef = function(name, sha) {
    refs[name] = {name:name, sha:sha}
  }
  
  that.getRemotes = function() {
    return _(remotes).clone()
  }
  
  that.addRemote = function(name, url) { 
    remotes[name] = new JsGit.Remote(this, name, url)
  }
  
  return that
}

// Helper for creating Repos for a Github proxy
JsGit.GithubProxyRepo = function(username, reponame, password) {
  var repo = new JsGit.Repo()
  repo.addRemote("origin", "http://localhost:3000/github/" + username + ":" + encodeURI(password) + "/" + reponame + ".git")
  return repo
}

