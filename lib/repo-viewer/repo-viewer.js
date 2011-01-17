
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
      RepoViewer.displayCommitAndParents(ref.sha, 20)
    })
  },
  
  clearTree: function() {
    $("#top-directory").html("")
  },
  
  displayCommitAndParents: function(commitOrSha, max) {
    var commit = RepoViewer.repo.objectify(commitOrSha)
    console.log(commit)
    var row = "<tr>"
    row += "<td>" + commit.message + "</td>"
    row += "<td>" + commit.author.split("<")[0]  + "</td>"
    console.log(commit.committer.split(">")[1])
    console.log(commit.committer.split(">")[1].split(" ")[1])
    var dateCommitted = new Date(parseInt(commit.committer.split(">")[1].split(" ")[1])*1000)
    row += "<td>" + dateCommitted.toUTCString() + "</td>"
    row += "</tr>"
    $("#commits table").append(row)
    if (max == 0) {
      return
    } else {
      _(commit.parents).each(function(parentSha) {
        RepoViewer.displayCommitAndParents(parentSha, max - 1)
      })
    }
  },
  
  displayTree: function(treeShaOrTree, target) {
    if (!target) {
      RepoViewer.clearTree()
      target = $("#top-directory")
    }
    var tree = RepoViewer.repo.objectify(treeShaOrTree)
    if (tree) {
      _(tree.contents).each(function(row) {
        var linkNode = $("<a>" + row.name + "</a>")
        var rowNode = $("<li></li>")
        linkNode.appendTo(rowNode)
        rowNode.appendTo(target)
        var subTreeNode = $("<ul></ul>")
        subTreeNode.appendTo(rowNode)
        if (row.mode == "040000") { // directory
          RepoViewer.displayTree(row.sha, subTreeNode)
        } else { // file
          linkNode.click(function(e) {
            e.preventDefault()
            var object = RepoViewer.repo.objectify(row.sha)
            $("#file-view").html(object.data)
          })
        }
      })
    } else {
      JsGit.handleError("couldn't find tree: " + treeShaOrTree)
    }
  },
  
  clearRefs: function() {
    $("#refs-list").html("<option value=\"\"></option>")
  },
  
  displayRefs: function(refs) {
    var i, ref
    _(refs).each(function(ref) {
      $("#refs-list").append('<option value="' + ref["name"] + '">' + ref["name"] + "</option>")
    })
  },
  
  clearFileView: function() {
    $('#file-view').html("")
  },
  
  displayRemoteLines: function(remoteLines) {
    var i;
    for(i = 0; i < remoteLines.length; i++ ) {
      $('#file-view').append("<br>remote: " + remoteLines[i]);
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
  
  githubDemo: function(username, reponame, password) {
    RepoViewer.repo = new JsGit.GithubProxyRepo(username, reponame, password)
    var origin = RepoViewer.repo.getRemote("origin")
    origin.fetchRefs(function() {
      RepoViewer.displayRefs(RepoViewer.repo.getAllRefs())
    })
  },
  
  clearErrors: function() {
    $("#jsgit-errors").html("")
  },
  
  demo: function(uri) {
    RepoViewer.clearTree()
    RepoViewer.clearFileView()
    RepoViewer.clearRefs()
    RepoViewer.clearErrors()
    var repo = new JsGit.Repo()
    RepoViewer.repo = repo
    console.log("creating repo with origin: " + uri)
    // if (uri.indexOf("//github.com")) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        // 
    // } else {
      repo.addRemote("origin", uri)
      var origin = repo.getRemote("origin")
      origin.fetchRefs(function() {
        RepoViewer.displayRefs(repo.getAllRefs())
      })
    
  }
}