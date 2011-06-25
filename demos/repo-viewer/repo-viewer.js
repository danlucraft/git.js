
RepoViewer = {
  repo: null,
  
  showRef: function(remoteAndRefName) {
    var remoteName = remoteAndRefName.split("/")[0]
    var refName = remoteAndRefName.split("/")[1]
    var origin = RepoViewer.repo.getRemote(remoteName)
    var ref = origin.getRef(refName)
    RepoViewer.repo.getObject(ref.sha, function(err, firstCommit) {
      RepoViewer.displayCommit(firstCommit)
      RepoViewer.highlightCommit(firstCommit.sha)
      RepoViewer.repo.getObject(firstCommit.tree, function(err, tree) { 
        RepoViewer.displayCommitDiff(firstCommit)
        RepoViewer.displayTree(tree) 
      })
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
        RepoViewer.repo.getObject(sha, function(err, commit) {
          RepoViewer.repo.getObject(commit.tree, function(err, tree) { 
            RepoViewer.displayCommitDiff(commit)
            RepoViewer.displayTree(tree) 
          })
        })
        RepoViewer.highlightCommit(sha)
        RepoViewer.clearFileView()
      }
    })
  },
  
  displayCommitDiffInfo: function(commit) {
    var str = ""
    str += "<div class='commit-info'>"
    str += "<div class='gravatar'>"
    str += "<img src='http://www.gravatar.com/avatar/" + MyMD5(commit.author.email) + "'>"
    str += "</div>"
    str += "<table>"
    str += "<tr><td>SHA</td><td>" + commit.sha + "</td></tr>"
    str += "<tr><td>Committer</td><td>" + commit.committer.name + 
      " &lt;" + commit.committer.email + "&gt;" + "</td></tr>"
    str += "<tr><td>Author</td><td>" + commit.author.name + 
      " &lt;" + commit.author.email + "&gt;" + "</td></tr>"
    str += "<tr><td>Committed</td><td>" + commit.committer.date.toUTCString() + "</td></tr>"
    str += "<tr><td>Authored</td><td>" + commit.author.date.toUTCString() + "</td></tr>"
    _(commit.parents).each(function(parentSha) {
      str += "<tr><td>Parent</td><td>" + parentSha + "</td></tr>"
    })
    str += "</table></div>"
    str += "<hr>"
    str += "<pre class='message'>" + commit.message + "</pre>"
    
    $("#diff").html(str)
  },
  
  displayCommitDiffDiff: function(commit) {
    RepoViewer.repo.getObject(commit.parents[0], function(err, parent) {
      var parentTree = parent ? parent.tree : null
      var treeDiff = new Git.TreeDiff(RepoViewer.repo, parentTree, commit.tree)
      treeDiff.toHtml(function(html) {
        $("#diff").append(html)
      })
    })
  },
  
  displayCommitDiff: function(commit) {
    RepoViewer.displayCommitDiffInfo(commit)
    if (commit.parents.length > 1) {
      $("#diff").append("Multiple parents.")
    }
    else {
      RepoViewer.displayCommitDiffDiff(commit)
    }
  },
  
  attachMoreCommitsEvents: function() {
    $(".more-commits").click(function(e) {
      e.preventDefault()
      $(e.target).parent().parent().parent().remove()
      var id = $(e.target).parent().attr("id")
      if (id.split("-")[0] == "more") {
        var sha = id.split("-")[1]
        RepoViewer.repo.getObject(sha, function(err, commit) {
          RepoViewer.displayCommitAndParents(commit, 10, function() {
            // $("#commits").scrollTop = $("#commits").height;
          })
        })
      }
    })
  },
  
  displayCommit: function(commit) {
    if ($("#commit-" + commit.sha).length == 0) {
      var row = "<tr>"
      row += "<td class=\"commit\" id=\"commit-" + commit.sha + "\">" + commit.message.split("\n")[0] + "</td>"
      row += "<td>" + commit.author.name  + "</td>"
      
      row += "<td>" + commit.author.date.toUTCString() + "</td>"
      row += "</tr>"
      $("#commits table").append(row)
    }
  },
  
  displayCommitAndParents: function(commit, max, callback) {
    this.displayCommit(commit)
    if (max == 0) {
      this.attachCommitClickEvents()
      var row = "<tr><td><a class='more-commits' id='more-" + commit.sha + "'><em>More...</em></a></td></tr>"
      $("#commits table").append(row)
      this.attachMoreCommitsEvents()
      if (callback) { callback() }
    } else {
      if (parentSha = commit.parents[0]) {
        RepoViewer.repo.getObject(commit.parents[0], function(err, parent) {
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
          RepoViewer.repo.getObject(row.sha, function(err, tree) { RepoViewer.displayTree(tree, subTreeNode) })
        })
      } else { // file
        linkNode.click(function(e) {
          e.preventDefault()
          RepoViewer.repo.getObject(row.sha, function(err, blob) { 
            $("#file-main").html("<pre id='file-view'></pre>")
            $("#file-view").addClass("brush: ruby")
            $("#file-view").html(blob.data)
            SyntaxHighlighter.highlight()
          })
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
    RepoViewer.repo = new Git.GithubProxyRepo(username, reponame, password)
    var origin = RepoViewer.repo.getRemote("origin")
    origin.fetchRefs(function() {
      RepoViewer.displayRefs(RepoViewer.repo.getAllRefs())
    })
  },
  
  clearErrors: function() {
    $("#Git-errors").html("")
  },
  
  demo: function(uri) {
    RepoViewer.clearTree()
    RepoViewer.clearFileView()
    RepoViewer.clearRefs()
    RepoViewer.clearCommits()
    RepoViewer.clearErrors()
    var repo = new Git.MemoryRepo()
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