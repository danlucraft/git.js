var path = require('path')
var sys  = require('sys')
Git.Cli = function(args, commandRunner) {
  var that           = this
  
  that.args          = args || []
  that.gitDir        = path.join(process.cwd(), ".git")
  that.commandRunner = commandRunner || new Git.CommandRunner()
  that.argsWithoutOptions = []
  that.argOptions = []
  
  that.args.forEach(function(arg) {
    if (!/^-/.exec(arg)) that.argsWithoutOptions.push(arg)
    
    var result = /^--git-dir=(.*)$/.exec(arg)
    if (result) {
      if (result[1][0] == "/") { 
        that.gitDir = result[1] 
      } else {
        that.gitDir = path.join(process.cwd(), result[1])
      }
    } else {
      result = /^(--.*)/.exec(arg)
      if (result) {
        that.argOptions.push(result[1])
      }
    }
  })
  that.commandName = that.argsWithoutOptions[0]
  
  that.repo = function() {
    return new Git.Repo(that.gitDir)
  }
  
  that.commandResultHandler = function(err, output) {
    if (err) return sys.puts(err)
    
    sys.puts(output + "\n")
  }
  
  that.run = function() {
    if (that.commandName == "show") {
      that.commandRunner.show(that.repo(), that.argsWithoutOptions.slice(1), that.argOptions, that.commandResultHandler)
    } else if (that.commandName == "log") {
      that.commandRunner.log(that.repo(), that.commandResultHandler)
    } else if (that.commandName == "branch") {
      that.commandRunner.branch(that.repo(), that.commandResultHandler)
    } else if (that.commandName == "diff") {
      that.commandRunner.diff(that.repo(), that.argsWithoutOptions.slice(1), that.argOptions, that.commandResultHandler)
    } else {
      sys.print("git.js: '" + that.commandName + "' is not a supported git command. See 'git.js --help'.\n")
    }
  }
}