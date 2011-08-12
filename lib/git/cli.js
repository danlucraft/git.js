var path = require('path')
  , sys  = require('sys')
  , Repo = require('./repo')
  , CommandRunner = require('./command-runner')
  , helpers = require('../string_helpers')

var Cli = function(args, commandRunner) {
  this.args          = args || []
  this.gitDir        = path.join(process.cwd(), ".git")
  this.commandRunner = commandRunner || new CommandRunner()
  this.argsWithoutOptions = []
  this.argOptions = []
  this.args.forEach(function(arg) {
    if (!/^-/.exec(arg)) this.argsWithoutOptions.push(arg)

    var result = /^--git-dir=(.*)$/.exec(arg)
    if (result) {
      if (result[1][0] == "/") {
        this.gitDir = result[1]
      } else {
        this.gitDir = path.join(process.cwd(), result[1])
      }
    } else {
      result = /^(--.*)/.exec(arg)
      if (result) {
        this.argOptions.push(result[1])
      }
    }
  }, this)
  this.commandName = this.argsWithoutOptions[0]
}

Cli.prototype.repo = function() {
  return new Repo(this.gitDir)
}

Cli.prototype.commandResultHandler = function(err, output) {
  if (err) {
    process.stderr.write(err)
    if(!process.stderr.flush())
      process.stderr.on('drain', process.exit.bind(process, 1))
  }

  process.stdout.write(output + "\n")
}

Cli.prototype.run = function() {
  if (this.commandName == "show") {
    this.commandRunner.show(this.repo(), this.argsWithoutOptions.slice(1), this.argOptions, this.commandResultHandler)
  } else if (this.commandName == "log") {
    this.commandRunner.log(this.repo(), this.commandResultHandler)
  } else if (this.commandName == "branch") {
    this.commandRunner.branch(this.repo(), this.commandResultHandler)
  } else if (this.commandName == "diff") {
    this.commandRunner.diff(this.repo(), this.argsWithoutOptions.slice(1), this.argOptions, this.commandResultHandler)
  } else {
    sys.print("git.js: '" + this.commandName + "' is not a supported git command. See 'git.js --help'.\n")
  }
}

module.exports = exports = Cli
