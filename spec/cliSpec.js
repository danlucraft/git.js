require('../lib/jsgit-server')
var path = require('path')

var mockRunner = {show:function() {}, log:function() {}}

describe("--git-dir", function() {
  it("default should be the current working directory", function() {
    var cli = new JsGit.Cli()
    
    expect(cli.repo.dir).toEqual(process.cwd())
  })
  
  it("can specify a relative git dir", function() {
    var cli = new JsGit.Cli(["--git-dir=.."])
    
    expect(cli.repo.dir).toEqual(path.join(process.cwd(), ".."))
  })
  
  it("can specify an absolute git dir", function() {
    var test_dir = path.join(process.cwd(), "..", "..")
    var cli = new JsGit.Cli(["--git-dir=" + test_dir])
    
    expect(cli.repo.dir).toEqual(path.join(process.cwd(), "..", ".."))
  })
})

describe("commands", function() {
  it("should run the show command", function() {
    spyOn(mockRunner, 'show')
    var cli = new JsGit.Cli(["show"], mockRunner)
    
    cli.run()
    
    expect(mockRunner.show).toHaveBeenCalledWith(cli.repo)
  })
  
  it("should run the log command", function() {
    spyOn(mockRunner, 'log')
    var cli = new JsGit.Cli(["log"], mockRunner)
    
    cli.run()
    
    expect(mockRunner.log).toHaveBeenCalledWith(cli.repo)
  })
})