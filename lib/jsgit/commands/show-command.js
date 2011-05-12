if (!JsGit.commands) JsGit.commands = {}

JsGit.commands.ShowCommand = function(repo, shas, options) {
  this.run = function(callback) {
    var sha = shas[0]
    repo.getObject(sha, function(object) {
      callback(object.toString())
    })
  }
}