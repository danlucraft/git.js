
require('../lib/git-server')

var createTestRepo = function() {
  return new Git.GithubProxyRepo("danlucraft", "clojure-dojo", "foopw") 
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
  
  testMakeUriNoOptions: function(test) {
    var remote = new Git.Remote(null, null, "http://google.com/")
    test.equals(remote.makeUri("/info/refs"), "http://google.com/info/refs")
    
    remote = new Git.Remote(null, null, "http://google.com")
    test.equals(remote.makeUri("/info/refs"), "http://google.com/info/refs")
    
    remote = new Git.Remote(null, null, "http://google.com")
    test.equals(remote.makeUri("/info/refs", {username: "danlucraft"}), "http://google.com/info/refs?username=danlucraft")

    remote = new Git.Remote(null, null, "http://google.com")
    test.equals(remote.makeUri("/info/refs", {username: "danlucraft", password: "asdf"}), "http://google.com/info/refs?username=danlucraft&password=asdf")
    test.done()
  },
  
  testMakeUriWithOptions: function(test) {
    var remote = new Git.Remote(null, null, "http://google.com?server=github.com")
    test.equals(remote.makeUri("/info/refs"), "http://google.com/info/refs?server=github.com")
    
    remote = new Git.Remote(null, null, "http://google.com/?server=github.com")
    test.equals(remote.makeUri("/info/refs"), "http://google.com/info/refs?server=github.com")
    
    remote = new Git.Remote(null, null, "http://google.com?server=github.com")
    test.equals(remote.makeUri("/info/refs", {username: "danlucraft"}), "http://google.com/info/refs?server=github.com&username=danlucraft")
    
    remote = new Git.Remote(null, null, "http://google.com?server=github.com")
    test.equals(remote.makeUri("/info/refs", {username: "danlucraft", password: "asdf"}), "http://google.com/info/refs?server=github.com&username=danlucraft&password=asdf")
    test.done()
  }
}
