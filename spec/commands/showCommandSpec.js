require('../../lib/jsgit-server')
var path = require('path')

describe("Show a commit", function() {
  var looseRepo
  var packedRepo

  beforeEach(function () {
    looseRepo = new JsGit.Repo(path.join(__dirname, "../../test/fixtures/test-repo1"))
    packedRepo = new JsGit.Repo(path.join(__dirname, "../../test/fixtures/test-repo1-packed"))
  })
  
  it("should show a loose blob", function() {
    var sha = "17cd63e8471b837707bb7840e87b1772579ab784"
    var cmd = new JsGit.commands.ShowCommand(looseRepo, [sha])
    var output = null
    
    cmd.run(function(r) { output = r })
    
    waitsFor(function() { return output },
      "Never found object", 10000)
      
    runs(function() {
      expect(output).not.toMatch(/^blob/)
      expect(output).toMatch(/Just a test repo for something I'm working on/)
    })
  })
  
  it("should show a packed blob", function() {
    var sha = "17cd63e8471b837707bb7840e87b1772579ab784"
    var cmd = new JsGit.commands.ShowCommand(packedRepo, [sha])
    var output = null
    
    cmd.run(function(r) { output = r })
    
    waitsFor(function() { return output },
      "Never found object", 10000)
      
    runs(function() {
      expect(output).not.toMatch(/^blob/)
      expect(output).toMatch(/Just a test repo for something I'm working on/)
    })
  })
  
  it("should show a loose tree", function() {
    var sha = "5541389163ccf38f7138c50c691c05e790d122d1"
    var cmd = new JsGit.commands.ShowCommand(looseRepo, [sha])
    var output = null
    
    cmd.run(function(r) { output = r })
    
    waitsFor(function() { return output },
      "Never found object", 10000)
      
    runs(function() {
      expect(output).toMatch(/tree 5541389163ccf38f7138c50c691c05e790d122d1/)
      expect(output).toMatch(/README/)
      expect(output).toMatch(/lib\//)
    })
  })
  
  it("should show a packed tree", function() {
    var sha = "5541389163ccf38f7138c50c691c05e790d122d1"
    var cmd = new JsGit.commands.ShowCommand(packedRepo, [sha])
    var output = null
    
    cmd.run(function(r) { output = r })
    
    waitsFor(function() { return output },
      "Never found object", 10000)
      
    runs(function() {
      expect(output).toMatch(/tree 5541389163ccf38f7138c50c691c05e790d122d1/)
      expect(output).toMatch(/README/)
      expect(output).toMatch(/lib\//)
    })
  })
})