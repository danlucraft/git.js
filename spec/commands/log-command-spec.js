require('../../lib/git-server')

var path = require('path')

describe("git log", function() {
  var looseRepo
  var packedRepo

  var expectOutput = function(cmd, cb) {
    var output = null
    
    cmd.run(function(e, r) { if (e) { throw(e) }; output = r })
    
    waitsFor(function() { return output },
      "output of '" + cmd + "'", 500)
      
      runs(function() {
      cb(output)
    })
  }

  beforeEach(function () {
    looseRepo = new Git.Repo(path.join(__dirname, "../../test/fixtures/test-repo1/.git"))
    packedRepo = new Git.Repo(path.join(__dirname, "../../test/fixtures/test-repo1-packed/.git"))
  })
  
  var expectLogOutput = 
    "commit 9f00c2ee854534a785ff01115a94a50c9961610d\n" + 
    "Author: Daniel Lucraft <dan@fluentradical.com>\n" + 
    "Date:   Mon Jan 03 2011 07:22:59 GMT+0000 (GMT)\n" + 
    "\n" + 
    "Modifiying master\n" + 
    "\n" + 
    "commit d0a9e5b650718445b53cd1cab40d21fb3891c98a\n" + 
    "Author: Daniel Lucraft <dan@fluentradical.com>\n" + 
    "Date:   Mon Jan 03 2011 07:14:11 GMT+0000 (GMT)\n" + 
    "\n" + 
    "Modify README\n" + 
    "\n" + 
    "commit b3453be87b70a0c5dea28aacd49cf34ddb91a8c5\n" + 
    "Author: Daniel Lucraft <dan@fluentradical.com>\n" + 
    "Date:   Mon Dec 27 2010 12:59:13 GMT+0000 (GMT)\n" + 
    "\n" + 
    "Add sample files"
        
  it("should show a list of branches, with the current highlighted (loose)", function() {
    var cmd = new Git.commands.LogCommand(looseRepo, [])
  
    expectOutput(cmd, function(output) {
      expect(output).toEqual(expectLogOutput)
    })
  })

  it("should show a list of branches, with the current highlighted (packed)", function() {
    var cmd = new Git.commands.LogCommand(packedRepo, [])
  
    expectOutput(cmd, function(output) {
      expect(output).toEqual(expectLogOutput)
    })
  })
})
