
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
      RepoViewer.repo.object(firstCommit.tree, function(tree) { 
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
  
  TreeDiffGenerator: function(prevTreeSha, thisTreeSha, callback, path) {
    this.thisTreeSha = thisTreeSha
    this.prevTreeSha = prevTreeSha
    this.path = path || ""
    this.waitingFor = 0
    this.incWaiting = function() {
      this.waitingFor += 1
      // console.log("add   one to " + this.path + " to get " + this.waitingFor)
    }
    this.decWaiting = function() {
      this.waitingFor -= 1
      // console.log("minus one to " + this.path + " to get " + this.waitingFor)
      this.finishIfDone()
    }
    this.finishIfDone = function() {
      if (this.waitingFor == 0 && !this.finished && this.doneAll) {
        // console.log("tree finished: " + this.path)
        this.finished = true
        callback(this.changes)
      }
    }
    this.finished = false
    this.doneAll = false
    this.changes = []
    
    this.compareBlobEntry = function(prevBlobEntry, thisBlobEntry) {
      if(!prevBlobEntry) {
        var changeInfo = ""
        changeInfo += "<div class='changed-file'>"
        changeInfo += "  <div class='filename'>new: " + this.path + thisBlobEntry.name + "</div>"
        changeInfo += "  <hr>"
        changeInfo += "</div>"
        this.changes.push(changeInfo)
      } else if (prevBlobEntry.sha != thisBlobEntry.sha) {
        var generator = this
        generator.incWaiting()
        RepoViewer.repo.object(prevBlobEntry.sha, function(prevBlob) {
          RepoViewer.repo.object(thisBlobEntry.sha, function(thisBlob) {
            var diffs = Diff.diff_patch(prevBlob.data.split("\n"), thisBlob.data.split("\n"))
            console.log(diffs)
            var str = []
            str.push("<div class='changed-file'>")
            str.push("  <div class='filename'><b>" + generator.path + thisBlobEntry.name + "</b></div>")
            str.push("  <div class='diff'>")
            _(diffs).each(function(diff) {
              var removed = diff.file1
              var added   = diff.file2
              str.push("@ " + added.offset)
              if (removed.length > 0) {
                _(removed.chunk).each(function(line) {
                  str.push("<pre class='removed'>-" + line + "</pre>")
                })
              }
              if (added.length > 0) {
                _(added.chunk).each(function(line) {
                  str.push("<pre class='added'>+" + line + "</pre>")
                })
              }
            })
            str.push("</div>")
            str.push("</div>")
            console.log(str.join("\n"))
            generator.changes.push(str.join("\n"))
            generator.decWaiting()
          })
        })
        this.changes.push(changeInfo)
      }
    }
    
    this.compareTreeEntry = function(prevTreeEntry, thisTreeEntry) {
      if (!prevTreeEntry) {
        var changeInfo = ""
        changeInfo += "<div class='changed-file'>"
        changeInfo += "  <div class='filename'>new directory: " + this.path + thisTreeEntry.name + "</div>"
        changeInfo += "  <hr>"
        changeInfo += "</div>"
        this.changes.push(changeInfo)
      } else if (prevTreeEntry.sha != thisTreeEntry.sha) {
        var generator = this
        generator.incWaiting()
        var subGenerator = new RepoViewer.TreeDiffGenerator(prevTreeEntry.sha, thisTreeEntry.sha, function(subChanges) {
          generator.changes = generator.changes.concat(subChanges)
          generator.decWaiting()
        }, generator.path + thisTreeEntry.name + "/")
        subGenerator.generate()
      }
    }
    
    this.compareTrees = function() {
      var generator = this
      var prevTreeHash = RepoViewer.treeAsHash(this.prevTree)
      _(this.thisTree.contents).each(function(thisEntry) {
        var prevEntry = prevTreeHash[thisEntry.name]
        if (thisEntry.type == "blob") {
          generator.compareBlobEntry(prevEntry, thisEntry)
        } else if (thisEntry.type == "tree") {
          generator.compareTreeEntry(prevEntry, thisEntry)
        }
      })
      this.doneAll = true
      generator.finishIfDone()
    }
    
    this.generate = function() {
      var generator = this
      RepoViewer.repo.object(generator.prevTreeSha, function(prevTree) {
        generator.prevTree = prevTree
        RepoViewer.repo.object(generator.thisTreeSha, function(thisTree) {
          generator.thisTree = thisTree
          generator.compareTrees()
        })
      })
    }
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
    RepoViewer.repo.object(commit.parents[0], function(parent) {
      var treeDiffGenerator = new RepoViewer.TreeDiffGenerator(parent.tree, commit.tree, function(changes) {
        $("#diff-view-window").append(changes.join("<br>"))
      })
      treeDiffGenerator.generate()
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