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
  }
}

