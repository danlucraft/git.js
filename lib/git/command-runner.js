var ShowCommand = require('./commands/show-command')
  , DiffCommand = require('./commands/diff-command')
  , BranchCommand = require('./commands/branch-command')
  , LogCommand = require('./commands/log-command')

var CommandRunner = function() {
};

CommandRunner.prototype.show = function(repo, shas, options, callback) {
  var cmd = new ShowCommand(repo, shas, options)
  cmd.run(callback)
}

CommandRunner.prototype.log = function(repo, cb) {
  var cmd = new LogCommand(repo)
  cmd.run(cb)
}

CommandRunner.prototype.branch = function(repo, cb) {
  var cmd = new BranchCommand(repo)
  cmd.run(cb)
}

CommandRunner.prototype.diff = function(repo, shas, options, cb) {
  var cmd = new DiffCommand(repo, shas, options)
  cmd.run(cb)
}

module.exports = exports = CommandRunner
