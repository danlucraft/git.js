if (!Git.commands) Git.commands = {}

Git.commands.ShowCommand = function(repo, shas, options) {
  this.run = function(callback) {
    var sha = shas[0]
    repo.getObject(sha, function(err, object) {
      if (err) return callback("err: " + err)
      
      callback(null, object.toString())
    })
  }
}