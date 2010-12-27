
JsGit.Repo = function() {
  var refs = {}
  var that = {}
  var remotes = {}
  var objects = {}
  
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
  
  that.addObject = function(sha, type, content) {
    var constructorName = {"blob": "Blob", "tree": "Tree", "commit": "Commit", "tag": "Tag"}[type]
    var constructor = JsGit.objects[constructorName]
    objects[sha] = new constructor(sha, content)
  }
  
  that.getObject = function(sha) {
    return objects[sha]
  }
  
  that.getObjectShas = function(sha) {
    return _(objects).keys()
  }
  
  that.objectCount = function() {
    return _(objects).keys().length
  }
  
  return that
}

// Helper for creating Repos for a Github proxy
JsGit.GithubProxyRepo = function(username, reponame, password) {
  var repo = new JsGit.Repo()
  repo.addRemote("origin", "http://localhost:3000/github/" + username + ":" + encodeURI(password) + "/" + reponame + ".git")
  return repo
}

