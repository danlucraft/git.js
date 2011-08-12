var TreeDiff = require('../tree-diff')

var DiffCommand = function(repo, shas, options) {
  this.fromCommitSha = shas && shas[0]
  this.toCommitSha   = shas && shas[1]
 
  this.repo = repo
  this.shas = shas
  this.options = options 
}

DiffCommand.prototype.toString = function() {
  return "git diff " + this.options.join(" ") + " " + this.shas.join(" ")
}

DiffCommand.prototype.run = function(cb) {
  var self = this
  if (!self.fromCommitSha || !self.toCommitSha) {
    return cb("git.js diff currently requires two commits exactly")
  }
  self.repo.getObject(self.fromCommitSha, function(err, fromCommit) {
    if (err) return cb(err)
    self.repo.getObject(self.toCommitSha, function(err, toCommit) {
      if (err) return cb(err)
      var treeDiff = new TreeDiff(self.repo, fromCommit.tree, toCommit.tree)
      treeDiff.toStat(cb)
    })
  })
}

module.exports = exports = DiffCommand
