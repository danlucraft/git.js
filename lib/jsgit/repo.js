
JsGit.Repo = function() {
  var refs = {}
  var that = {}
  var remotes = {}
  var objects = {}
  
  that.getRef = function(refname) {
    return refs[refname]
  }
  
  that.getRefs = function() {
    return _(refs).values()
  }
  
  that.haveRefs = function(refs) {
    var have = []
    _(refs).each(function(ref) {
      if (that.getObject(ref.sha) != null) {
        have.push(ref)
      }
    })
    return have
  }
  
  that.getAllRefs = function() {
    return _(that.getRemotes()).reduce(function(memo, remote) {
      return memo.concat(remote.getRefs())
    }, that.getRefs())
  }
  
  that.addRef = function(name, sha) {
    refs[name] = {name:name, sha:sha, remote:null}
  }
  
  that.getRemote = function(name) {
    return remotes[name]
  }
  
  that.getRemotes = function() {
    return _(remotes).values()
  }
  
  that.addRemote = function(name, url) { 
    remotes[name] = new JsGit.Remote(this, name, url)
  }
  
  that.addObject = function(sha, type, content) {
    var constructorName = {"blob": "Blob", "tree": "Tree", "commit": "Commit", "tag": "Tag"}[type]
    var constructor = JsGit.objects[constructorName]
    objects[sha] = new constructor(sha, content)
    return objects[sha]
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

