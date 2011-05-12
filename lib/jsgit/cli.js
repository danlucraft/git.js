var path = require('path')

JsGit.Cli = function(args, commandRunner) {
  var that           = this
  
  that.args          = args || []
  that.gitDir        = process.cwd()
  that.commandRunner = commandRunner
  that.argsWithoutOptions = []
  
  that.args.forEach(function(arg) {
    if (!/^-/.exec(arg)) that.argsWithoutOptions.push(arg)
    
    var result = /^--git-dir=(.*)$/.exec(arg)
    if (result) {
      if (result[1][0] == "/") { 
        that.gitDir = result[1] 
      } else {
        that.gitDir = path.join(process.cwd(), result[1])
      }
    }
  })
  that.repo        = new JsGit.Repo(that.gitDir)
  that.commandName = that.argsWithoutOptions[0]
  
  that.run = function() {
    if (that.commandName == "show") {
      that.commandRunner.show(that.repo, that.argsWithoutOptions.slice(1))
    } else if (that.commandName == "log") {
      that.commandRunner.log(that.repo)
    }
    
    // var repo = new JsGit.Repo()
    // repo.getLooseObject("0d9c45117cd2f34ca93a1e31a7fc69f50d54b34b", function(obj) {
    //   console.log(obj)
    // })
  }
}