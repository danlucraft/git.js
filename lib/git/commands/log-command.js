if (!Git.commands) Git.commands = {}

Git.commands.LogCommand = function(repo, options) {
  var that = this
  
  that.maxCommits = 10
  
  // callback takes (err, commit)
  var walkCommits = function(commitSha, callback, result) {
    var result = result || {done: false, commits: []}
    
    if (result.done) return
    
    repo.getObject(commitSha, function(err, commit) {
      if (result.done) return
      if (err) return callback(err)
      
      result.commits.push(commit)
      
      if (result.commits.length == that.maxCommits) {
        result.done = true
        callback(null, result.commits)
      } else {
        if (commit.parents.length > 0) {
          commit.parents.forEach(function(parentSha) {
            walkCommits(parentSha, callback, result)
          })
        } else {
          result.done = true
          return callback(null, result.commits)
        }
      }
    })
  }
  
  that.toString = function() {
    return "git log"
  }
  
  that.run = function(cb) {
    repo.getHead(function(err, head) {
      if (err) return cb(err)
      
      repo.getBranches(function(err, branches) {
        if (err) return cb(err)
        if (branches.branchNames.length == 0) return cb("No branches found to log")
        
        var i = that.maxCommits
        var log = []
        
        walkCommits(branches[head], function(err, commits) {
          if (err) return cb(err)
          commits.forEach(function(commit) {
            log.push(commit.toString())
          })
          return cb(null, log.join("\n\n"))
        })
        
      })
    })
  }
}
