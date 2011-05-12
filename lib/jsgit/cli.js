var path = require('path')

JsGit.Cli = function(args) {
  var that = this
  this.args = args || []
  
  this.gitDir = process.cwd()
  
  this.args.forEach(function(arg) {
    var result = /^--git-dir=(.*)$/.exec(arg)
    if (result) {
      if (result[1][0] == "/") { 
        that.gitDir = result[1] 
      } else {
        that.gitDir = path.join(process.cwd(), result[1])
      }
    }
  })
  
  this.run = function() {
    console.log("current dir: " + gitDir())
    var repo = new JsGit.Repo()
    repo.getLooseObject("0d9c45117cd2f34ca93a1e31a7fc69f50d54b34b", function(obj) {
      console.log(obj)
    })
  }
}