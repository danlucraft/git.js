require('../lib/jsgit-server')

exports.Repo = { 
  testCreate: function(test) {
    var repo = new JsGit.Repo()
    test.done()
  },
  
  testEmpty: function(test) {
    var repo = new JsGit.Repo()
    test.equal(_(repo.getRefs()).keys().length, 0)
    test.equal(_(repo.getRemotes()).keys().length, 0)
    test.done()
  }
}

var createTestRepo = function() {
  return new JsGit.GithubProxyRepo("danlucraft", "clojure-dojo", "foopw") 
}
  
exports.GithubProxyRepo = {
  testCreate: function(test) {
    var repo = createTestRepo()
    test.ok(repo)
    test.done()
  },
  
  testHasRemote: function(test) {
    var repo = createTestRepo()
    test.deepEqual(repo.getRemotes()["github"], {name: "github", url: "http://localhost:3000/github/danlucraft:foopw/clojure-dojo.git"})
    test.done()
  },
  
  testAddRef: function(test) {
    var repo = createTestRepo()
    test.deepEqual(repo.getRefs(), {})
    
    repo.addRef("master", "yurrffff")
    test.equals(_(repo.getRefs()).keys().length, 1)
    test.deepEqual(repo.getRefs()["master"], {name: "master", sha: "yurrffff"})
    test.done()
  }
}