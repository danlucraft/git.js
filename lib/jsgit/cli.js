var path = require('path')

JsGit.Cli = function(args, commandRunner) {
  var that           = this
  
  that.args          = args || []
  that.gitDir        = process.cwd()
  that.commandRunner = commandRunner
  
  that.args.forEach(function(arg) {
    var result = /^--git-dir=(.*)$/.exec(arg)
    if (result) {
      if (result[1][0] == "/") { 
        that.gitDir = result[1] 
      } else {
        that.gitDir = path.join(process.cwd(), result[1])
      }
    }
  })
  
  that.run = function() {
    that.commandRunner.show(1)
    
    // var repo = new JsGit.Repo()
    // repo.getLooseObject("0d9c45117cd2f34ca93a1e31a7fc69f50d54b34b", function(obj) {
    //   console.log(obj)
    // })
  }
}