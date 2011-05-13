var path = require('path')

JsGit.Cli = function(args, commandRunner) {
  var that           = this
  
  that.args          = args || []
  that.repoDir       = process.cwd()
  that.commandRunner = commandRunner || new JsGit.CommandRunner()
  that.argsWithoutOptions = []
  
  that.args.forEach(function(arg) {
    if (!/^-/.exec(arg)) that.argsWithoutOptions.push(arg)
    
    var result = /^--git-dir=(.*)$/.exec(arg)
    if (result) {
      if (result[1][0] == "/") { 
        that.repoDir = result[1] 
      } else {
        that.repoDir = path.join(process.cwd(), result[1])
      }
    }
  })
  that.commandName = that.argsWithoutOptions[0]
  
  that.repo = function() {
    new JsGit.Repo(that.repoDir)
  }
  
  that.run = function() {
    if (that.commandName == "show") {
      that.commandRunner.show(that.repo, that.argsWithoutOptions.slice(1), {}, function(output) {
        console.log(output)
      })
    } else if (that.commandName == "log") {
      that.commandRunner.log(that.repo)
    } else {
      console.log("git.js: '" + that.commandName + "' is not a supported git command. See 'git.js --help'.")
    }
    
    // var repo = new JsGit.Repo()
    // repo.getLooseObject("0d9c45117cd2f34ca93a1e31a7fc69f50d54b34b", function(obj) {
    //   console.log(obj)
    // })
  }
}