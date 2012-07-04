var HttpRemote = require('./http_remote')
  , _ = require('underscore')
  , Objects = require('./objects')

var MemoryRepo = function() {
  this.refs = {}
  this.that = {}
  this.remotes = {}
  this.objects = {}
};


MemoryRepo.prototype.getRef = function(refname) {
  return this.refs[refname]
}

MemoryRepo.prototype.getRefs = function() {
  return _(this.refs).values()
}

MemoryRepo.prototype.haveRefs = function(refs) {
  var have = []
  _(refs).each(function(ref) {
    if (this.objects[ref.sha] != null) {
      have.push(ref)
    }
  })
  return have
}

MemoryRepo.prototype.getAllRefs = function() {
  return _(that.getRemotes()).reduce(function(memo, remote) {
    return memo.concat(remote.getRefs())
  }, that.getRefs())
}

// Add a ref to this repo. fullName is of the form:
//   refs/heads/master or refs/tags/123
MemoryRepo.prototype.addRef = function(fullName, sha) {
  var type = fullName.split("/")[1]
  var name = fullName.split("/")[2]
  this.refs[name] = {name:name, sha:sha, remote:null, type:type}
}

MemoryRepo.prototype.getRemote = function(name) {
  return this.remotes[name]
}

MemoryRepo.prototype.getRemotes = function() {
  return _(this.remotes).values()
}

MemoryRepo.prototype.addRemote = function(name, url) {
  this.remotes[name] = new HttpRemote(this, name, url)
}

MemoryRepo.prototype.addRemoteObject = function(name, remote) {
  this.remotes[name] = remote
}

MemoryRepo.prototype.makeAndAddObject = function(sha, type, content) {
  this.objects[sha] = Objects.make(sha, type, content)
  return this.objects[sha]
}

MemoryRepo.prototype.addObject = function(object) {
  this.objects[object.sha] = object
  return object
}

MemoryRepo.prototype.getObjectShas = function(sha) {
  return _(this.objects).keys()
}

MemoryRepo.prototype.objectCount = function() {
  return _(this.objects).keys().length
}

MemoryRepo.prototype.getObject = function(sha, callback) {
  var already = this.objects[sha]
  if (already) { return callback(null, already) }

  var remote = that.getRemotes()[0]
  remote.getObject(sha, function(object) {
    if (object) {
      that.addObject(object)
    }
    callback(null, object)
  })
}

module.exports = exports = MemoryRepo 
