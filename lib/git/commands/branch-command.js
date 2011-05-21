if (!Git.commands) Git.commands = {}

Git.commands.BranchCommand = function(repo, options) {
  this.run = function(cb) {
    repo.getBranches(function(err, branches) {
      if (err) return cb(err)
      
      repo.getHead(function(err, head) {
        if (err) return cb(err)
        
        var str = ""
        branches.branchNames.forEach(function(name) {
          var prefix = (name == head ? "* " : "  ")
          str += prefix + name + "\n"
        })
        return cb(null, str)
      })
    })
  }
}