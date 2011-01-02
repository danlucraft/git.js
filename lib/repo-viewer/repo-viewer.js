
RepoViewer = {
  repo: null,
  
  displayRefs: function(refs) {
    var i, ref
    for (i = 0; i < refs.length; i++) {
      ref = refs[i]
      if (ref["name"].slice(0, 5) == "refs/") {
        $("#refs-list").append('<option value="' + ref["name"] + '">' + ref["name"] + "</option>")
      }
    }
  },
  
  displayRemoteLines: function(remoteLines) {
    var i;
    for(i = 0; i < remoteLines.length; i++ ) {
      $('#remote-lines').append("<br>remote: " + remoteLines[i]);
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
      RepoViewer.repo = new JsGit.GithubProxyRepo(username, reponame, password)
      var origin = RepoViewer.repo.getRemotes()["origin"]
      origin.fetchRefs(function() {
        RepoViewer.displayRefs(_(RepoViewer.repo.getRefs()).values())
      })
    } catch (e) {
      console.log(e)
    }
  }
}