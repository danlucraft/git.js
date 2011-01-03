
RepoViewer = {
  repo: null,
  
  showRef: function(remoteAndRefName) {
    var remoteName = remoteAndRefName.split("/")[0]
    var refName = remoteAndRefName.split("/")[1]
    var origin = RepoViewer.repo.getRemote(remoteName)
    var ref = origin.getRef(refName)
    origin.fetchRef(ref, function(remoteLines, newObjects) {
      RepoViewer.displayRemoteLines(remoteLines)
      var commit = RepoViewer.repo.getObject(ref.sha)
      RepoViewer.displayTree(commit.tree)
    })
  },
  
  displayTree: function(treeShaOrTree, target) {
    if (!target) {
      $("#top-directory").html("")
      target = $("#top-directory")
    }
    var tree = RepoViewer.repo.objectify(treeShaOrTree)
    _(tree.contents).each(function(row) {
      var rowNode = $("<li>" + row.name + "</li>")
      rowNode.appendTo(target)
      var subTreeNode = $("<ul></ul>")
      subTreeNode.appendTo(rowNode)
      if (row.mode == "040000") { // directory
        RepoViewer.displayTree(row.sha, subTreeNode)
      }
    })
  },
  
  displayRefs: function(refs) {
    var i, ref
    _(refs).each(function(ref) {
      $("#refs-list").append('<option value="' + ref["name"] + '">' + ref["name"] + "</option>")
    })
  },
  
  displayRemoteLines: function(remoteLines) {
    var i;
    for(i = 0; i < remoteLines.length; i++ ) {
      $('#remote-lines').append("<br>remote: " + remoteLines[i]);
    }
  },
  
  displayObjects: function(newObjects) {
    $("#objects").append("<li><strong>" + newObjects.length  +" Objects" + "</strong></li>")
    _(newObjects).each(function(object) {
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
    RepoViewer.repo = new JsGit.GithubProxyRepo(username, reponame, password)
    var origin = RepoViewer.repo.getRemote("origin")
    origin.fetchRefs(function() {
      RepoViewer.displayRefs(RepoViewer.repo.getAllRefs())
    })
  }
}