require('../../lib/jsgit-server')
var path = require('path')

describe("git branch", function() {
  var repo

  beforeEach(function () {
    repo = new JsGit.Repo(path.join(__dirname, "../../test/fixtures/test-repo1"))
  })
  // 
  // it("should show a list of branches, with the current highlighted", function() {
  //   var cmd = new JsGit.commands.BranchCommand(repo, [])
  //   var output = null
  //   
  //   cmd.run(function(r) { output = r })
  //   
  //   waitsFor(function() { return output },
  //     "Never found object", 10000)
  //     
  //   runs(function() {
  //     expect(output).toMatch(/branch1/)
  //     expect(output).toMatch(/\* master/)
  //   })
  //   
  // })

})
