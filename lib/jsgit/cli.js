
JsGit.Cli = function(args) {
  this.args = args
  this.run = function() {
    console.log("current dir: " + process.cwd())
    var repo = new JsGit.Repo()
    repo.getLooseObject("0d9c45117cd2f34ca93a1e31a7fc69f50d54b34b", function(obj) {
      console.log(obj)
    })
  }
}