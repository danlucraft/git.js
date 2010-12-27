require('../lib/jsgit-server')

exports['new Repo'] = function(test) {
  var repo = new JsGit.Repo()
  test.done()
}

var createTestRepo = function() {
  return new JsGit.GithubProxyRepo("danlucraft", "clojure-dojo", "foopw") 
}
  
exports.GithubProxyRepo = {
  testCreateRepo: function(test) {
    var repo = createTestRepo()
    test.ok(repo)
    test.equals(repo.getUrl(), "http://localhost:3000/github/danlucraft:foopw/clojure-dojo.git")
    test.done()
  },
  
  testAddRef: function(test) {
    var repo = createTestRepo()
    test.equals(repo.getRefs().length, 0)
    
    repo.addRef("master", "yurrffff")
    
    test.equals(repo.getRefs().length, 1)
    test.deepEqual(repo.getRefs()[0], {name: "master", sha: "yurrffff"})
    test.done()
  }
}