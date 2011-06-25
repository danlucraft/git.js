require('../../lib/git-server')

var path = require('path')

describe("git diff", function() {
  var looseRepo
  var packedRepo

  beforeEach(function () {
    looseRepo = new Git.Repo(path.join(__dirname, "../../test/fixtures/test-repo1/.git"))
    packedRepo = new Git.Repo(path.join(__dirname, "../../test/fixtures/test-repo1-packed/.git"))
  })
  
  it("diffs two commits", function() {
    
  })
  
})

  