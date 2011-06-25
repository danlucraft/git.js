
Git.TreeDiff = function(repo, prevTreeSha, thisTreeSha, path) {
  var that = this
  that.repo        = repo
  that.thisTreeSha = thisTreeSha
  that.prevTreeSha = prevTreeSha
  that.path        = path || ""
  that.waitingFor  = 0
  
  var changesToHtml = function(changes) {        
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
    
    _(changes).each(function(change) {
      str.push("<div class='changed-file'>")
      str.push("  <div class='filename'><b>" + change.name + "</b></div>")
      var diff = new Git.FileDiff(change.blob[0], change.blob[1])
      str.push(diff.toHtml())
      str.push("</div>")
    })
    return str.join("\n")
  }
  
  var changesToStat = function(changes) {        
    var str = []
    var result = {insertions: 0, deletions: 0}
    _(changes).each(function(change) {
      var diff = new Git.FileDiff(change.blob[0], change.blob[1])
      var stat = diff.stat()
      result.insertions += stat.insertions
      result.deletions  += stat.deletions
      var changeStr = []
      changeStr.push(" " + change.name + " |    " + (stat.insertions + stat.deletions) + " ")
      for(var i = 0; i < stat.insertions; i++) changeStr.push("+")
      for(var i = 0; i < stat.deletions; i++)  changeStr.push("-")
      str.push(changeStr.join(""))
    })
    str.push(" " + changes.length + " files changed, " + 
      result.insertions + " insertions(+), " + 
      result.deletions  + " deletions(-)")
    
    return str.join("\n")
  }
  
  that.incWaiting = function() {
    that.waitingFor += 1
  }
  
  that.decWaiting = function() {
    that.waitingFor -= 1
    that.finishIfDone()
  }
  
  that.finishIfDone = function() {
    if (that.waitingFor == 0 && !that.finished && that.doneAll) {
      that.finished = true
      that.callback(that.changes)
    }
  }
  
  that.finished = false
  that.doneAll = false
  that.changes = null
  
  that.compareBlobEntry = function(prevBlobEntry, thisBlobEntry) {
    var generator = that
    if(!prevBlobEntry) {
      var name = that.path + thisBlobEntry.name
      generator.incWaiting()
      repo.getObject(thisBlobEntry.sha, function(err, thisBlob) {
        generator.changes.push({type:"new", blob: ["", thisBlob.data], name: name})
        generator.decWaiting()
      })
    } else if (!thisBlobEntry) {
      var name = that.path + prevBlobEntry.name
      generator.incWaiting()
      repo.getObject(prevBlobEntry.sha, function(err, prevBlob) {
        generator.changes.push({type:"removed", blob: [prevBlob.data, ""], name: name})
        generator.decWaiting()
      })
    } else if (prevBlobEntry.sha != thisBlobEntry.sha) {
      var name = that.path + thisBlobEntry.name
      var generator = that
      generator.incWaiting()
      repo.getObject(prevBlobEntry.sha, function(err, prevBlob) {
        repo.getObject(thisBlobEntry.sha, function(err, thisBlob) {
          generator.changes.push({type:"changed", blob: [prevBlob.data, thisBlob.data], name: name})
          generator.decWaiting()
        })
      })
    }
  }
  
  that.compareTreeEntry = function(prevTreeEntry, thisTreeEntry) {
    var generator = that
    if (!prevTreeEntry) {
      generator.incWaiting()
      var subTreeDiff = new Git.TreeDiff(repo, null, thisTreeEntry.sha)
      subTreeDiff.generateChanges(function(subChanges) {
        generator.changes = generator.changes.concat(subChanges)
        generator.decWaiting()
      }, generator.path + thisTreeEntry.name + "/")
    } else if (!thisTreeEntry) {
      generator.incWaiting()
      var subTreeDiff = new Git.TreeDiff(repo, prevTreeEntry.sha, null)
      subTreeDiff.generateChanges(function(subChanges) {
        generator.changes = generator.changes.concat(subChanges)
        generator.decWaiting()
      }, generator.path + prevTreeEntry.name + "/")
    } else if (prevTreeEntry.sha != thisTreeEntry.sha) {
      generator.incWaiting()
      var subTreeDiff = new Git.TreeDiff(repo, prevTreeEntry.sha, thisTreeEntry.sha)
      subTreeDiff.generateChanges(function(subChanges) {
        generator.changes = generator.changes.concat(subChanges)
        generator.decWaiting()
      }, generator.path + thisTreeEntry.name + "/")
    }
  }
  
  that.compareTrees = function() {
    var generator = that
    var prevTreeHash = null
    var thisTreeHash = null
    if (that.prevTree) {
      prevTreeHash = that.prevTree.asHash()
    } else {
      prevTreeHash = {}
    }
    if (that.thisTree) {
      thisTreeHash = that.thisTree.asHash()
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
    that.doneAll = true
    generator.finishIfDone()
  }
  
  that.toHtml = function(callback) {
    that.generateChanges(function(changes) {
      callback(changesToHtml(changes))
    })
  }
  
  that.toStat = function(callback) {
    that.generateChanges(function(changes) {
      callback(null, changesToStat(changes))
    })
  }
  
  that.generateChanges = function(callback) {
    if (that.changes === null) {
      that.callback = callback
      that.changes = []
      repo.getObject(that.prevTreeSha, function(err, prevTree) {
        if (err) return callback(err)
        
        that.prevTree = prevTree
        
        repo.getObject(that.thisTreeSha, function(err, thisTree) {
          if (err) return callback(err)
        
          that.thisTree = thisTree
          return that.compareTrees()
        })
      })
    }
    else {
      return callback(that.changes)
    }
  }
}
