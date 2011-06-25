require('../../lib/git-server')

var path = require('path')

describe("git diff", function() {
  var looseRepo
  var packedRepo

  beforeEach(function () {
    looseRepo = new Git.Repo(path.join(__dirname, "../../test/fixtures/test-repo1/.git"))
    packedRepo = new Git.Repo(path.join(__dirname, "../../test/fixtures/test-repo1-packed/.git"))
  })
  
  var expectOutput = function(cmd, cb) {
    var output = null
    
    cmd.run(function(e, r) { if (e) { throw(e) }; output = r })
    
    waitsFor(function() { return output },
      "output of '" + cmd + "'", 500)
      
      runs(function() {
        cb(output)
      }
    )
  }

  var expectedOutput = 
    "diff --git a/README b/README\n" + 
    "index 17cd63e..538789a 100644\n" + 
    "--- a/README\n" + 
    "+++ b/README\n" + 
    "@@ -1,4 +1,4 @@\n" + 
    "-asdfTest Repo1\n" + 
    "+j9yp4asdfTest Repo1\n" + 
    " ==========\n" + 
    " \n" + 
    " Just a test repo for something I'm working on"
  
  var expectedStatOutput = 
    " README |    2 +-\n" + 
    " 1 files changed, 1 insertions(+), 1 deletions(-)"
   
  it("diff stats two commits (loose)", function() {
    var cmd = new Git.commands.DiffCommand(looseRepo, ["d0a9e5b650718445b53cd1cab40d21fb3891c98a", "9f00c2ee854534a785ff01115a94a50c9961610d"], ["--stat"])
    
    expectOutput(cmd, function(output) {
      expect(output).toEqual(expectedStatOutput)
    })
  })
  
  // it("diffs two commits (loose)", function() {
  //   var cmd = new Git.commands.DiffCommand(looseRepo, ["d0a9e5b650718445b53cd1cab40d21fb3891c98a", "9f00c2ee854534a785ff01115a94a50c9961610d"])
  //   
  //   expectOutput(cmd, function(output) {
  //     expect(output).toEqual(expectedOutput)
  //   })
  // })
})

  