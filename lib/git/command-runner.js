
Git.CommandRunner = function() {
  this.show = function(repo, shas, options, callback) {
    var cmd = new Git.commands.ShowCommand(repo, shas, options)
    cmd.run(callback)
  }
  
  this.log = function(repo, cb) {
    var cmd = new Git.commands.LogCommand(repo)
    cmd.run(cb)
  }
  
  this.branch = function(repo, cb) {
    var cmd = new Git.commands.BranchCommand(repo)
    cmd.run(cb)
  }
}