var Repo = require('../../lib/git/repo')
  , BranchCommand = require('../../lib/git/commands/branch-command')

var path = require('path')

describe("git branch", function() {
  var repo

  var expectOutput = function(cmd, cb) {
    var output = null
    
    cmd.run(function(e, r) { if (e) { throw(e) }; output = r })
    
    waitsFor(function() { return output },
      "Never received output", 10000)
      
      runs(function() {
      cb(output)
    })
  }

  beforeEach(function () {
    repo = new Repo(path.join(__dirname, "../../test/fixtures/test-repo1/.git"))
  })
  
  it("should show a list of branches, with the current highlighted", function() {
    var cmd = new BranchCommand(repo, [])

    expectOutput(cmd, function(output) {
      expect(output).toMatch(/branch1/)
      expect(output).toMatch(/\* branch2/)
    })
  })
})
