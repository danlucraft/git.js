
RepoViewer = {
  displayRefs: function(refs) {
    var i, ref
    for (i = 0; i < refs.length; i++) {
      ref = refs[i]
      $("#refs").append("<li>" + ref["name"] + ":" + ref["sha"] + "</li>")
    }
  },
  
  displayRemoteLines: function(remoteLines) {
    var i;
    for(i = 0; i < remoteLines.length; i++ ) {
      $('#response2').append("<br>remote: " + remoteLines[i]);
    }
  },
  
  displayObjects: function(repo) {
    _(repo.getObjectShas()).each(function(sha) {
      var object = repo.getObject(sha)
      if (object.type == "tree") {
        var tree = object
        var str = "<li>" + tree.sha + ": <ul>"
        _(tree.contents).each(function(row) {
          str += "<li>" + row.name + ": " + row.sha + "</li>"
        })
        str += "</ul></li><br>"
        $("#objects").append(str)
      }
      else {
        $("#objects").append("<li>" + object.sha + "<br><pre>" + object.data + "</pre></li>")
      }
    })
  },
  
  demo: function(username, reponame, password) {
    try {
      var repo = new JsGit.GithubProxyRepo(username, reponame, password)
      var origin = repo.getRemotes()["origin"]
      origin.fetchRefs(function() {
        origin.fetchRef(repo.getRefs()["refs/heads/master"], function(remoteLines) {
          RepoViewer.displayRefs(repo.getRefs())
          RepoViewer.displayRemoteLines(remoteLines)
          RepoViewer.displayObjects(repo)
        })
      })
    } catch (e) {
      console.log(e)
    }
  }
}