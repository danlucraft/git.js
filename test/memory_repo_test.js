var MemoryRepo = require('../lib/git/memory_repo')
  , GithubProxyRepo = require('../lib/git/github_repo')

exports.MemoryRepo = { 
  testCreate: function(test) {
    var repo = new MemoryRepo()
    test.done()
  },
  
  testEmpty: function(test) {
    var repo = new MemoryRepo()
    test.equal(repo.getRefs().length, 0)
    test.equal(repo.getRemotes().length, 0)
    test.done()
  },
  
  testAddRef: function(test) {
    var repo = new MemoryRepo()
    test.deepEqual(repo.getRefs(), [])
    
    repo.addRef("refs/heads/master", "yurrffff")
    test.equals(repo.getRefs().length, 1)
    test.deepEqual(repo.getRef("master"), {name: "master", sha: "yurrffff", remote: null, type:"heads"})
    test.done()
  },
  
  testAddRemote: function(test) {
    var repo = new MemoryRepo()
    test.deepEqual(repo.getRemotes(), [])
    
    repo.addRemote("origin", "http://www.yahoo.com/")
    
    test.equals(repo.getRemotes().length, 1)
    test.deepEqual(repo.getRemote("origin").url, "http://www.yahoo.com")
    test.done()
  },
  
  testMakeAndAddObject: function(test) {
    var repo = new MemoryRepo()
    test.deepEqual(repo.objectCount(), 0)
    
    repo.makeAndAddObject("asdfasdf", "blob", "Hello World!")
    
    test.equals(repo.objectCount(), 1)
    repo.getObject("asdfasdf", function(err, obj) {
      test.deepEqual(obj.type, "blob"); 
    })
    repo.getObject("asdfasdf", function(err, obj) {
      test.deepEqual(obj.data, 'Hello World!');      
    })
    test.done()
  }
}

var createTestRepo = function() {
  return new GithubProxyRepo("danlucraft", "clojure-dojo", "foopw") 
}

exports.GithubProxyRepo = {
  testCreate: function(test) {
    var repo = createTestRepo()
    test.ok(repo)
    test.done()
  },
  
  testHasRemote: function(test) {
    var repo = createTestRepo()
    var remote = repo.getRemote("origin")
    test.equals(remote.url, "http://localhost:3000/danlucraft/clojure-dojo.git")
    test.equals(remote.repo, repo)
    test.done()
  },
  
}
