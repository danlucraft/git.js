if (!JsGit.commands) JsGit.commands = {}

JsGit.commands.LogCommand = function(repo, options) {
  this.run = function(cb) {
    repo.getHead(function(err, head) {
      if (err) return cb(err)
      
      repo.getBranches(function(err, branches) {
        if (err) return cb(err)
        
        var currentCommitSha = branches[head]
        var currentCommit
        
        repo.getObject(currentCommitSha, function(err, object) {
          if (err) return cb(err)
          
          currentCommit = object
          var log = currentCommit.toString()
          return cb(null, log)
        })
        
      })
    })
  }
}