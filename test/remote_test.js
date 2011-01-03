require('../lib/jsgit-server')

var createTestRepo = function() {
  return new JsGit.GithubProxyRepo("danlucraft", "clojure-dojo", "foopw") 
}
  
exports.Remote = {
  testGetRemote: function(test) {
    var repo = createTestRepo();
    var remote = repo.getRemote("origin")
    test.equals(remote.name, "origin")
    test.ok(remote.url)
    test.done()
  },
  
  testAddRef: function(test) {
    var repo = createTestRepo()
    var remote = repo.getRemote("origin")
    test.deepEqual(repo.getRefs(), [])
    
    remote.addRef("refs/heads/master", "yurrffff")
    test.equals(remote.getRefs().length, 1)
    test.deepEqual(remote.getRef("master"), {name: "origin/master", sha: "yurrffff", remote: remote, type: "heads"})
    test.done()
  },
}

