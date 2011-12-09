var Repo = require('../../lib/git/repo')
  , LogCommand = require('../../lib/git/commands/log-command')

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
    looseRepo = new Repo(path.join(__dirname, "../../test/fixtures/test-repo1/.git"))
    packedRepo = new Repo(path.join(__dirname, "../../test/fixtures/test-repo1-packed/.git"))
  })
  
  var expectPackedLogOutput = 
    "commit 9f00c2ee854534a785ff01115a94a50c9961610d\n" + 
    "Author: Daniel Lucraft <dan@fluentradical.com>\n" + 
    "Date:   Mon, 03 Jan 2011 07:22:59 +0000\n" + 
    "\n" + 
    "Modifiying master\n" + 
    "\n" + 
    "commit d0a9e5b650718445b53cd1cab40d21fb3891c98a\n" + 
    "Author: Daniel Lucraft <dan@fluentradical.com>\n" + 
    "Date:   Mon, 03 Jan 2011 07:14:11 +0000\n" + 
    "\n" + 
    "Modify README\n" + 
    "\n" + 
    "commit b3453be87b70a0c5dea28aacd49cf34ddb91a8c5\n" + 
    "Author: Daniel Lucraft <dan@fluentradical.com>\n" + 
    "Date:   Mon, 27 Dec 2010 12:59:13 +0000\n" + 
    "\n" + 
    "Add sample files"

    var expectLooseLogOutput =
    'commit 8e8b973cde2e6470626dedfc5d82716d1450dcda\n'+
    'Author: Daniel Lucraft <dan@fluentradical.com>\n'+
    'Date:   Mon, 03 Jan 2011 07:08:07 +0000\n'+
    '\n'+
    'Thoroughly modified the README\n'+
    '\n'+
    'commit b3453be87b70a0c5dea28aacd49cf34ddb91a8c5\n'+
    'Author: Daniel Lucraft <dan@fluentradical.com>\n'+
    'Date:   Mon, 27 Dec 2010 12:59:12 +0000\n'+
    '\n'+
    'Add sample files'

  it("should show a list of branches, with the current highlighted (loose)", function() {
    var cmd = new LogCommand(looseRepo, [])
  
    expectOutput(cmd, function(output) {
      expect(output).toEqual(expectLooseLogOutput)
    })
  })

  it("should show a list of branches, with the current highlighted (packed)", function() {
    var cmd = new LogCommand(packedRepo, [])
  
    expectOutput(cmd, function(output) {
      expect(output).toEqual(expectPackedLogOutput)
    })
  })
})
