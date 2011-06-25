if (!Git.commands) Git.commands = {}

Git.commands.DiffCommand = function(repo, shas, options) {
  var that    = this
  var fromCommitSha = shas && shas[0]
  var toCommitSha   = shas && shas[1]
  
  that.toString = function() {
    return "git diff " + options.join(" ") + " " + shas.join(" ")
  }
  
  that.run = function(cb) {
    if (!fromCommitSha || !toCommitSha) {
      return cb("git.js diff currently requires two commits exactly")
    }
    repo.getObject(fromCommitSha, function(err, fromCommit) {
      if (err) return cb(err)
      repo.getObject(toCommitSha, function(err, toCommit) {
        if (err) return cb(err)
        var treeDiff = new Git.TreeDiff(repo, fromCommit.tree, toCommit.tree)
        treeDiff.toStat(cb)
      })
    })
  }
}
