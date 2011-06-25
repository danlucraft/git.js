

Git.FileDiff = function(file1, file2, options) {
  this.lines1 = file1.split("\n")
  this.lines2 = file2.split("\n")
  this.diffChunks = Diff.diff_patch(this.lines1, this.lines2)
  var options = options || {}
  this.contextLength = options.context || 3
  
  this.toInfo = function() {
    if (file1 === "") {
      var infoChunk = {offset: 1, lines:[]}
      _(this.lines2).each(function(line, i) {
        infoChunk.lines.push({oldIndex: null, newIndex:(i + 1), line: line, type:"added"})
      })
      return [infoChunk]
    }
    if (file2 === "") {
      var infoChunk = {offset: 1, lines:[]}
      _(this.lines1).each(function(line, i) {
        infoChunk.lines.push({oldIndex: (i + 1), newIndex:null, line: line, type:"removed"})
      })
      return [infoChunk]
    }
    var infos = []
    var diff = this
    var totalAdded = 0
    var totalRemoved = 0
    var lastInfoChunk = null
    var infoChunk = null
    _(this.diffChunks).each(function(chunk) {
      var removed = chunk.file1
      var added   = chunk.file2
      infoChunk = null
      var removeContext = null
      var overlapLength = null
      var lastLineNewIndex = null
      if (lastInfoChunk) {
        var lastLine = lastInfoChunk.lines[lastInfoChunk.lines.length - 1]
        if (lastLine.oldIndex >= Math.max(removed.offset - diff.contextLength, 0)) {
          infoChunk = lastInfoChunk
          overlapLength = lastLine.oldIndex - Math.max(removed.offset - diff.contextLength, 0)
          removeContext = Math.min(overlapLength, diff.contextLength)
          lastInfoChunk.lines = lastInfoChunk.lines.slice(0, lastInfoChunk.lines.length - removeContext)
          lastLineNewIndex = lastInfoChunk.lines[lastInfoChunk.lines.length - 1].newIndex
        }
      }
      infoChunk = infoChunk || {offset: added.offset + 1, lines:[]}
      var preContextRange = [Math.max(removed.offset - diff.contextLength, 0), Math.max(removed.offset, 0)]
      var preContext = diff.lines1.slice(preContextRange[0], preContextRange[1])
      _(preContext).each(function(line, i) {
        var oldIx = preContextRange[0] + i + 1
        var newIx = oldIx + totalAdded - totalRemoved
        if (newIx > lastLineNewIndex) {
          infoChunk.lines.push({oldIndex: oldIx, newIndex:newIx, line: line, type:"context"})
        }
      })
      
      if (removed.length > 0) {
        _(removed.chunk).each(function(line, i) {
          var oldIx = removed.offset + i + 1
          infoChunk.lines.push({oldIndex: oldIx, newIndex:null, line: line, type:"removed"})
        })
      }
      
      if (added.length > 0) {
        _(added.chunk).each(function(line, i) {
          var newIx = added.offset + i + 1
          infoChunk.lines.push({oldIndex: null, newIndex:newIx, line: line, type:"added"})
        })
      }
      
      var postContextRange = [(added.offset - totalAdded + totalRemoved) + removed.length, (added.offset - totalAdded + totalRemoved) + diff.contextLength + removed.length]
      var postContext = diff.lines1.slice(postContextRange[0], postContextRange[1])
      _(postContext).each(function(line, i) {
        var oldIx = postContextRange[0] + i + 1
        var newIx = oldIx + added.length - removed.length + totalAdded - totalRemoved
        infoChunk.lines.push({oldIndex: oldIx, newIndex:newIx, line: line, type:"context"})
      })
      totalAdded += added.length
      totalRemoved += removed.length
      if (infoChunk !== lastInfoChunk) {
        infos.push(infoChunk)
      }
      lastInfoChunk = infoChunk
    })
    return infos
  }
  
  this.info = this.toInfo()
  
  this.toString = function() {
    return "asdf"
  }
  
  this.toHtml = function() {
    var str = []
    str.push("  <div class='diff'>")
    var diff = this
    _(this.info).each(function(chunk) {
      _(chunk.lines).each(function(line) {
        var truncatedLine = Git.escapeHTML(line.line.slice(0, Git.FileDiff.MAX_LINE_CHARS))
        if (line.type == "context") {
          var oldIx = line.oldIndex.toString().rjust(2, " ")
          var newIx = line.newIndex.toString().rjust(2, " ")
          str.push("<pre class='context'>" + oldIx + " " + newIx + "  " + truncatedLine + "</pre>")
        } else if (line.type == "added") {
          var newIx = line.newIndex.toString().rjust(2, " ")
          str.push("<pre class='added'>" + "   " + newIx + " +" + truncatedLine + "</pre>")
        } else if (line.type == "removed") {
          var oldIx = line.oldIndex.toString().rjust(2, " ")
          str.push("<pre class='removed'>" + oldIx + "    -" + truncatedLine + "</pre>")
        }
      })
    })
    str.push("</div>")
    return str.join("\n")
  }
  
  this.stat = function() {
    var result = {insertions: 0, deletions: 0}
    _(this.info).each(function(chunk) {
      _(chunk.lines).each(function(line) {
        if (line.type == "context") {
        } else if (line.type == "added") {
          result.insertions += 1
        } else if (line.type == "removed") {
          result.deletions += 1
        }
      })
    })
    return result
  }
}

Git.FileDiff.MAX_LINE_CHARS = 140
