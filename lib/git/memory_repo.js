
Git.MemoryRepo = function() {
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
      if (objects[ref.sha] != null) {
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
  
  // Add a ref to this repo. fullName is of the form:
  //   refs/heads/master or refs/tags/123
  that.addRef = function(fullName, sha) {
    var type = fullName.split("/")[1]
    var name = fullName.split("/")[2]
    refs[name] = {name:name, sha:sha, remote:null, type:type}
  }
  
  that.getRemote = function(name) {
    return remotes[name]
  }
  
  that.getRemotes = function() {
    return _(remotes).values()
  }
  
  that.addRemote = function(name, url) { 
    remotes[name] = new Git[Git.REMOTE_TYPE](this, name, url)
  }
  
  that.addRemoteObject = function(name, remote) {
    remotes[name] = remote
  }
  
  that.makeAndAddObject = function(sha, type, content) {
    objects[sha] = Git.objects.make(sha, type, content)
    return objects[sha]
  }
  
  that.addObject = function(object) {
    objects[object.sha] = object
    return object
  }
  
  that.getObjectShas = function(sha) {
    return _(objects).keys()
  }
  
  that.objectCount = function() {
    return _(objects).keys().length
  }
  
  that.getObject = function(sha, callback) {
    var already = objects[sha]
    if (already) { return callback(null, already) }
  
    var remote = that.getRemotes()[0]
    remote.getObject(sha, function(object) {
      if (object) {
        that.addObject(object)
      }
      callback(null, object)
    })
  }
  
  return that
}

// Helper for creating Repos for a Github proxy
Git.GithubProxyRepo = function(username, reponame, password) {
  var repo = new Git.MemoryRepo()
  var githubCredentials = "password=" + encodeURI(password) + "&username=" + username
  var remoteUrl = "http://localhost:3000/" + username + "/" + reponame + ".git?server=" + encodeURI("https://github.com") + "&" + githubCredentials
  repo.addRemote("origin", remoteUrl)
  return repo
}












