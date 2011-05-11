
JsGit.Cli = function(args) {
  this.args = args
  this.run = function() {
    console.log("current dir: " + process.cwd())
    var repo = new JsGit.Repo()
    console.log(repo)
  }
}