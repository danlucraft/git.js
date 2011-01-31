require('../lib/jsgit-server')

var createTestRepo = function() {
  return new JsGit.GithubProxyRepo("danlucraft", "clojure-dojo", "foopw") 
}
  
var REMOTE_TEST_DATA = {
  infoRefs: "8c8d26e2f993c2c0112f5637cb05f06a95af34d8\trefs/heads/dbl-extract-models\n2d2d022c9955efc58bec5232116935de719efda4\trefs/heads/master\n"
}

exports.Remote = {
  testParseDumbInfoRefs: function(test) {
    test.done()
  },
  
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
    var remote = new JsGit.Remote(null, null, "http://google.com/")
    test.equals(remote.makeUri("/info/refs"), "http://google.com/info/refs")
    
    remote = new JsGit.Remote(null, null, "http://google.com")
    test.equals(remote.makeUri("/info/refs"), "http://google.com/info/refs")
    
    remote = new JsGit.Remote(null, null, "http://google.com")
    test.equals(remote.makeUri("/info/refs", {username: "danlucraft"}), "http://google.com/info/refs?username=danlucraft")

    remote = new JsGit.Remote(null, null, "http://google.com")
    test.equals(remote.makeUri("/info/refs", {username: "danlucraft", password: "asdf"}), "http://google.com/info/refs?username=danlucraft&password=asdf")
    test.done()
  },
  
  testMakeUriWithOptions: function(test) {
    var remote = new JsGit.Remote(null, null, "http://google.com?server=github.com")
    test.equals(remote.makeUri("/info/refs"), "http://google.com/info/refs?server=github.com")
    
    remote = new JsGit.Remote(null, null, "http://google.com/?server=github.com")
    test.equals(remote.makeUri("/info/refs"), "http://google.com/info/refs?server=github.com")
    
    remote = new JsGit.Remote(null, null, "http://google.com?server=github.com")
    test.equals(remote.makeUri("/info/refs", {username: "danlucraft"}), "http://google.com/info/refs?server=github.com&username=danlucraft")
    
    remote = new JsGit.Remote(null, null, "http://google.com?server=github.com")
    test.equals(remote.makeUri("/info/refs", {username: "danlucraft", password: "asdf"}), "http://google.com/info/refs?server=github.com&username=danlucraft&password=asdf")
    test.done()
  }
}

