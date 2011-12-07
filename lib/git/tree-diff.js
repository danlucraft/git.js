var FileDiff = require('./file-diff')
  , _ = require('underscore')

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
    var diff = new FileDiff(change.blob[0], change.blob[1])
    str.push(diff.toHtml())
    str.push("</div>")
  })
  return str.join("\n")
}

var changesToStat = function(changes) {
  var str = []
  var result = {insertions: 0, deletions: 0}
  _(changes).each(function(change) {
    var diff = new FileDiff(change.blob[0], change.blob[1])
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

var TreeDiff = function(repo, prevTreeSha, thisTreeSha, path) {
  this.repo        = repo
  this.thisTreeSha = thisTreeSha
  this.prevTreeSha = prevTreeSha
  this.path        = path || ""
  this.waitingFor  = 0

  this.finished = false
  this.doneAll = false
  this.changes = null
}

TreeDiff.prototype.incWaiting = function() {
  this.waitingFor += 1
}

TreeDiff.prototype.decWaiting = function() {
  this.waitingFor -= 1
  this.finishIfDone()
}

TreeDiff.prototype.finishIfDone = function() {
  if (this.waitingFor == 0 && !this.finished && this.doneAll) {
    this.finished = true
    this.callback(this.changes)
  }
}

TreeDiff.prototype.compareBlobEntry = function(prevBlobEntry, thisBlobEntry) {
  var generator = this
  if(!prevBlobEntry) {
    var name = this.path + thisBlobEntry.name
    generator.incWaiting()
    this.repo.getObject(thisBlobEntry.sha, function(err, thisBlob) {
      if (err) throw err;
      generator.changes.push({type:"new", blob: ["", thisBlob.data], name: name})
      generator.decWaiting()
    })
  } else if (!thisBlobEntry) {
    var name = this.path + prevBlobEntry.name
    generator.incWaiting()
    this.repo.getObject(prevBlobEntry.sha, function(err, prevBlob) {
      if (err) throw err;
      generator.changes.push({type:"removed", blob: [prevBlob.data, ""], name: name})
      generator.decWaiting()
    })
  } else if (prevBlobEntry.sha != thisBlobEntry.sha) {
    var name = this.path + thisBlobEntry.name
    generator.incWaiting()
    this.repo.getObject(prevBlobEntry.sha, function(err, prevBlob) {
      if (err) throw err;
      generator.repo.getObject(thisBlobEntry.sha, function(err, thisBlob) {
        if (err) throw err;
        generator.changes.push({type:"changed", blob: [prevBlob.data, thisBlob.data], name: name})
        generator.decWaiting()
      })
    })
  }
}

TreeDiff.prototype.compareTreeEntry = function(prevTreeEntry, thisTreeEntry) {
  var generator = this
  if (!prevTreeEntry) {
    generator.incWaiting()
    var subTreeDiff = new TreeDiff(this.repo, null, thisTreeEntry.sha)
    subTreeDiff.generateChanges(function(subChanges) {
      generator.changes = generator.changes.concat(subChanges)
      generator.decWaiting()
    }, generator.path + thisTreeEntry.name + "/")
  } else if (!thisTreeEntry) {
    generator.incWaiting()
    var subTreeDiff = new TreeDiff(this.repo, prevTreeEntry.sha, null)
    subTreeDiff.generateChanges(function(subChanges) {
      generator.changes = generator.changes.concat(subChanges)
      generator.decWaiting()
    }, generator.path + prevTreeEntry.name + "/")
  } else if (prevTreeEntry.sha != thisTreeEntry.sha) {
    generator.incWaiting()
    var subTreeDiff = new TreeDiff(this.repo, prevTreeEntry.sha, thisTreeEntry.sha)
    subTreeDiff.generateChanges(function(subChanges) {
      generator.changes = generator.changes.concat(subChanges)
      generator.decWaiting()
    }, generator.path + thisTreeEntry.name + "/")
  }
}

TreeDiff.prototype.compareTrees = function() {
  var generator = this
  var prevTreeHash = null
  var thisTreeHash = null
  if (this.prevTree && this.prevTree.asHash) {
    prevTreeHash = this.prevTree.asHash()
  } else {
    prevTreeHash = {}
  }
  if (this.thisTree) {
    thisTreeHash = this.thisTree.asHash()
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

TreeDiff.prototype.toHtml = function(callback) {
  this.generateChanges(function(changes) {
    callback(changesToHtml(changes))
  })
}

TreeDiff.prototype.toStat = function(callback) {
  this.generateChanges(function(changes) {
    callback(null, changesToStat(changes))
  })
}

TreeDiff.prototype.generateChanges = function(callback) {
  if (this.changes === null) {
    this.callback = callback
    this.changes = []
    var self = this
    self.repo.getObject(this.prevTreeSha, function(err, prevTree) {
      if (err) return callback(err)

      self.prevTree = prevTree

      self.repo.getObject(self.thisTreeSha, function(err, thisTree) {
        if (err) return callback(err)

        self.thisTree = thisTree
        return self.compareTrees()
      })
    })
  }
  else {
    return callback(this.changes)
  }
}

module.exports = TreeDiff
