
RepoViewer = {
  repo: null,
  
  showRef: function(remoteAndRefName) {
    var remoteName = remoteAndRefName.split("/")[0]
    var refName = remoteAndRefName.split("/")[1]
    var origin = RepoViewer.repo.getRemote(remoteName)
    var ref = origin.getRef(refName)
    RepoViewer.repo.object(ref.sha, function(firstCommit) {
      RepoViewer.displayCommit(firstCommit)
      RepoViewer.highlightCommit(firstCommit.sha)
      RepoViewer.repo.object(firstCommit.tree, function(tree) { RepoViewer.displayTree(tree) })
      RepoViewer.displayCommitAndParents(firstCommit, 10)
    })
  },
  
  clearTree: function() {
    $("#top-directory").html("")
  },
  
  highlightCommit: function(sha) {
    $("#commits .displayed").removeClass("displayed")
    $("#commit-" + sha).addClass("displayed")
  },
  
  attachCommitClickEvents: function() {
    $(".commit").click(function(e) {
      e.preventDefault()
      var id = $(e.target).attr("id")
      if (id.split("-")[0] == "commit") {
        var sha = id.split("-")[1]
        var commit = RepoViewer.repo.getObject(sha)
        RepoViewer.repo.object(commit.tree, function(tree) { 
          RepoViewer.displayCommitDiff(commit)
          RepoViewer.displayTree(tree) 
        })
        RepoViewer.highlightCommit(sha)
        RepoViewer.clearFileView()
      }
    })
  },
  
  displayCommitDiffInfo: function(commit) {
    var str = ""
    str += "<table>"
    str += "<tr><td>SHA</td><td>" + commit.sha + "</td></tr>"
    console.log(commit)
    str += "<tr><td>Committer</td><td>" + commit.committer.name + "</td></tr>"
    str += "<tr><td>Author</td><td>" + commit.author.name + "</td></tr>"
    str += "<tr><td>Message</td><td>" + commit.message + "</td></tr>"
    str += "<tr><td>Committed</td><td>" + commit.committer.date.toUTCString() + "</td></tr>"
    str += "<tr><td>Authored</td><td>" + commit.author.date.toUTCString() + "</td></tr>"
    _(commit.parents).each(function(parentSha) {
      str += "<tr><td>Parent</td><td>" + parentSha + "</td></tr>"
    })
    str += "</table><hr>"
    $("#diff-view-window").html(str)
  },
  
  treeAsHash: function(tree) {
    var result = {}
    _(tree.contents).each(function(entry) {
      result[entry.name] = entry
    })
    return result
  },
  
  displayCommitDiffDiff: function(commit) {
    RepoViewer.repo.object(commit.tree, function(thisTree) {
      RepoViewer.repo.object(commit.parents[0], function(parent) {
        RepoViewer.repo.object(parent.tree, function(prevTree) {
          var str = []
          var prevTreeHash = RepoViewer.treeAsHash(prevTree)
          _(thisTree.contents).each(function(thisEntry) {
            var prevEntry = prevTreeHash[thisEntry.name]
            if (prevEntry && prevEntry.sha != thisEntry.sha) {
              str.push(thisEntry.name + " changed")
            } else if(!prevEntry) {
              str.push(thisEntry.name + " new")
            }
          })
          $("#diff-view-window").append(str.join("<br>"))
        })
      })
    })
  },
  
  displayCommitDiff: function(commit) {
    RepoViewer.displayCommitDiffInfo(commit)
    if (commit.parents.length > 1) {
      $("#diff-view-window").append("Multiple parents.")
    }
    else {
      RepoViewer.displayCommitDiffDiff(commit)
    }
  },
  
  attachMoreCommitsEvents: function() {
    $(".more-commits").click(function(e) {
      e.preventDefault()
      $(e.target).parent().parent().remove()
      var id = $(e.target).attr("id")
      if (id.split("-")[0] == "more") {
        var sha = id.split("-")[1]
        var commit = RepoViewer.repo.getObject(sha)
        RepoViewer.displayCommitAndParents(commit, 10, function() {
          // $("#commits").scrollTop = $("#commits").height;
        })
      }
    })
  },
  
  displayCommit: function(commit) {
    if ($("#commit-" + commit.sha).length == 0) {
      var row = "<tr>"
      row += "<td class=\"commit\" id=\"commit-" + commit.sha + "\">" + commit.message + "</td>"
      row += "<td>" + commit.author.justName  + "</td>"
      
      row += "<td>" + commit.author.date.toUTCString() + "</td>"
      row += "</tr>"
      $("#commits table").append(row)
    }
  },
  
  displayCommitAndParents: function(commit, max, callback) {
    this.displayCommit(commit)
    if (max == 0) {
      this.attachCommitClickEvents()
      var row = "<tr><td><a class='more-commits' id='more-" + commit.sha + "'>More...</a></td></tr>"
      $("#commits table").append(row)
      this.attachMoreCommitsEvents()
      if (callback) { callback() }
    } else {
      if (parentSha = commit.parents[0]) {
        RepoViewer.repo.object(commit.parents[0], function(parent) {
          RepoViewer.displayCommitAndParents(parent, max - 1, callback)
        })
      } else {
        this.attachCommitClickEvents()
        if (callback) { callback() }
      }
    }
  },
  
  clearCommits: function() {
    $("#commits table").html("")
  },
  
  displayTree: function(tree, target) {
    if (!target) {
      RepoViewer.clearTree()
      target = $("#top-directory")
    }
    _(tree.contents).each(function(row) {
      var linkNode = $("<a>" + row.name + "</a>")
      var rowNode = $("<li></li>")
      linkNode.appendTo(rowNode)
      rowNode.appendTo(target)
      var subTreeNode = $("<ul></ul>")
      subTreeNode.appendTo(rowNode)
      if (row.mode == "040000") { // directory
        linkNode.click(function(e) {
          RepoViewer.repo.object(row.sha, function(tree) { RepoViewer.displayTree(tree, subTreeNode) })
        })
      } else { // file
        linkNode.click(function(e) {
          e.preventDefault()
          RepoViewer.repo.object(row.sha, function(blob) { $("#file-view").html(blob.data) })
        })
      }
    })
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
    RepoViewer.clearCommits()
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