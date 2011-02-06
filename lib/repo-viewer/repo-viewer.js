
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
    }
    this.decWaiting = function() {
      this.waitingFor -= 1
      this.finishIfDone()
    }
    this.finishIfDone = function() {
      if (this.waitingFor == 0 && !this.finished && this.doneAll) {
        this.finished = true
        callback(this.changes)
      }
    }
    this.finished = false
    this.doneAll = false
    this.changes = []
    
    this.compareBlobEntry = function(prevBlobEntry, thisBlobEntry) {
      var generator = this
      if(!prevBlobEntry) {
        var name = this.path + thisBlobEntry.name
        generator.incWaiting()
        RepoViewer.repo.object(thisBlobEntry.sha, function(thisBlob) {
          generator.changes.push({type:"new", blob: ["", thisBlob.data], name: name})
          generator.decWaiting()
        })
      } else if (!thisBlobEntry) {
        var name = this.path + prevBlobEntry.name
        generator.incWaiting()
        RepoViewer.repo.object(prevBlobEntry.sha, function(prevBlob) {
          generator.changes.push({type:"removed", blob: [prevBlob.data, ""], name: name})
          generator.decWaiting()
        })
      } else if (prevBlobEntry.sha != thisBlobEntry.sha) {
        var name = this.path + thisBlobEntry.name
        var generator = this
        generator.incWaiting()
        RepoViewer.repo.object(prevBlobEntry.sha, function(prevBlob) {
          RepoViewer.repo.object(thisBlobEntry.sha, function(thisBlob) {
            generator.changes.push({type:"changed", blob: [prevBlob.data, thisBlob.data], name: name})
            generator.decWaiting()
          })
        })
      }
    }
    
    this.compareTreeEntry = function(prevTreeEntry, thisTreeEntry) {
      var generator = this
      if (!prevTreeEntry) {
        generator.incWaiting()
        var subGenerator = new RepoViewer.TreeDiffGenerator(null, thisTreeEntry.sha, function(subChanges) {
          generator.changes = generator.changes.concat(subChanges)
          generator.decWaiting()
        }, generator.path + thisTreeEntry.name + "/")
        subGenerator.generate()
      } else if (!thisTreeEntry) {
        generator.incWaiting()
        var subGenerator = new RepoViewer.TreeDiffGenerator(prevTreeEntry.sha, null, function(subChanges) {
          generator.changes = generator.changes.concat(subChanges)
          generator.decWaiting()
        }, generator.path + prevTreeEntry.name + "/")
        subGenerator.generate()
      } else if (prevTreeEntry.sha != thisTreeEntry.sha) {
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
      var prevTreeHash = null
      var thisTreeHash = null
      if (this.prevTree) {
        prevTreeHash = RepoViewer.treeAsHash(this.prevTree)
      } else {
        prevTreeHash = {}
      }
      if (this.thisTree) {
        thisTreeHash = RepoViewer.treeAsHash(this.thisTree)
      } else {
        thisTreeHash = {}
      }
      var names = _(_(thisTreeHash).keys().concat(_(prevTreeHash).keys())).uniq()
      _(names).each(function(name) {
        var prevEntry = prevTreeHash[name]
        var thisEntry = thisTreeHash[name]
        var prevType = (prevEntry ? prevEntry.type : null)
        var thisType = (thisEntry ? thisEntry.type : null)
        if (prevType == thisType || prevType == null || thisType == null) {
          var type = prevType || thisType
          if (type == "blob") {
            generator.compareBlobEntry(prevEntry, thisEntry)
          } else if (type == "tree") {
            generator.compareTreeEntry(prevEntry, thisEntry)
          }
        } else {
          // entry changed from a dir to a file or vice versa
          if (prevType == "blob" && thisType == "tree") {
            generator.compareBlobEntry(prevEntry, null)
            generator.compareTreeEntry(null, thisEntry)
          }
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
      var parentTree = parent ? parent.tree : null
      var treeDiffGenerator = new RepoViewer.TreeDiffGenerator(parentTree, commit.tree, function(changes) {
        var str = []
        str.push("<table class='commit-summary'>")
        _(changes).each(function(change) {
          str.push("<tr>")
          if (change.type == "new") {
            str.push("<td class='modification new'>new</td><td>" + change.name + "</td>")
          } else if (change.type == "changed") {
            str.push("<td class='modification changed'>changed</td><td>" + change.name + "</td>")
          } else if (change.type == "removed") {
            str.push("<td class='modification removed'>removed</td><td>" + change.name + "</td>")
          }
          str.push("</tr>")
        })
        str.push("</table>")
        str.push("<hr>")
        $("#diff-view-window").append(str.join("\n"))
        
        var str = []
        _(changes).each(function(change) {
          str.push("<div class='changed-file'>")
          str.push("  <div class='filename'><b>" + change.name + "</b></div>")
          var diff = new JsGit.Diff(change.blob[0], change.blob[1])
          str.push(diff.toHtml())
          str.push("</div>")
        })
        $("#diff-view-window").append(str.join("\n"))
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
          RepoViewer.repo.object(row.sha, function(blob) { 
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