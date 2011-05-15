if (!JsGit.commands) JsGit.commands = {}

JsGit.commands.BranchCommand = function(repo, options) {
  this.run = function(cb) {
    repo.getBranches(function(err, branches) {
      if (err) return cb(err)
      
      repo.getHead(function(err, head) {
        if (err) return cb(err)
        
        var str = ""
        branches.forEach(function(pair) {
          var prefix = (pair[0] == head ? "* " : "  ")
          str += prefix + pair[0] + "\n"
        })
        return cb(null, str)
      })
    })
  }
}