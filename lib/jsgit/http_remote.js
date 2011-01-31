
JsGit.HttpRemote = function(repo, name, repoUrl) {
  JsGit.Remote.apply(this, [repo, name, repoUrl])

  this.fetchRefs = function(callback) {
    $.get(
      this.makeUri('/info/refs'),
      "",
      function(data) {
        console.log(data.toString())
      }
    )
  }
}

// Parses the contents of the .git/info/refs file
JsGit.HttpRemote.parseInfoRefs = function(data) {
  var lines = data.split("\n")
  var refs = {}
  _(lines).each(function(line) {
    if (line !== "") {
      var tabStops = line.split("\t")
      refs[tabStops[1]] = tabStops[0]
    }
  })
  return refs
}
