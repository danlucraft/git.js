
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
  
  that.objectify = function(shaOrObject) {
    if (shaOrObject.type == "commit" || shaOrObject.type == "tree" || shaOrObject.type == "blob" || shaOrObject.type == "tag") {
      return shaOrObject
    }
    else if (_.isString(shaOrObject)) {
      return that.getObject(shaOrObject)
    }
    
  }
  
  return that
}

// Helper for creating Repos for a Github proxy
JsGit.GithubProxyRepo = function(username, reponame, password) {
  var repo = new JsGit.Repo()
  var githubCredentials = "password=" + encodeURI(password) + "&username=" + username
  var remoteUrl = "http://localhost:3000/" + username + "/" + reponame + ".git?server=" + encodeURI("https://github.com") + "&" + githubCredentials
  repo.addRemote("origin", remoteUrl)
  return repo
}

