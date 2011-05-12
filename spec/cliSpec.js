require('../lib/jsgit-server')
var path = require('path')

describe("--git-dir", function() {
  it("default should be the current working directory", function() {
    var cli = new JsGit.Cli()
    
    expect(cli.gitDir).toEqual(process.cwd())
  })
  
  it("can specify a relative git dir", function() {
    var cli = new JsGit.Cli(["--git-dir=.."])
    
    expect(cli.gitDir).toEqual(path.join(process.cwd(), ".."))
  })
  
  it("can specify an absolute git dir", function() {
    var test_dir = path.join(process.cwd(), "..", "..")
    var cli = new JsGit.Cli(["--git-dir=" + test_dir])
    
    expect(cli.gitDir).toEqual(path.join(process.cwd(), "..", ".."))
  })
})

describe("commands", function() {
  it("should run the show command", function() {
    var runner = {show:function() {}}
    
    spyOn(runner, 'show')
    var cli = new JsGit.Cli(["show"], runner)
    
    cli.run()
    
    expect(runner.show).toHaveBeenCalledWith(1)
  })
})