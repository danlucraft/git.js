
JsGit.CommandRunner = function() {
  this.show = function(repo, shas, options, callback) {
    var cmd = new JsGit.commands.ShowCommand(repo, shas, options)
    cmd.run(callback)
  }
  
  this.log = function(repo) {
  }
  
  this.branch = function(repo, cb) {
    var cmd = new JsGit.commands.BranchCommand(repo)
    cmd.run(cb)
  }
}