
JsGit.Diff = function(file1, file2) {
  this.lines1 = file1.split("\n")
  this.lines2 = file2.split("\n")
  this.diffChunks = Diff.diff_patch(this.lines1, this.lines2)
  
  this.toInfo = function() {
    var infos = []
    var diff = this
    _(this.diffChunks).each(function(chunk) {
      var removed = chunk.file1
      var added   = chunk.file2
      var infoChunk = {offset: removed.offset + 1, lines:[]}
      var preContextRange = [removed.offset - 3, removed.offset]
      var preContext = diff.lines1.slice(preContextRange[0], preContextRange[1])
      
      _(preContext).each(function(line, i) {
        var oldIx = preContextRange[0] + i + 1
        var newIx = oldIx
        infoChunk.lines.push({oldIndex: oldIx, newIndex:newIx, line: line, type:"context"})
      })
      
      if (added.length > 0) {
        _(added.chunk).each(function(line, i) {
          var newIx = added.offset + i + 1
          infoChunk.lines.push({oldIndex: null, newIndex:newIx, line: line, type:"added"})
        })
      }
      
      infos.push(infoChunk)
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
    var fileOffset = 0
    var totalRemoved = 0
    var diff = this
    _(this.diffChunks).each(function(chunk) {
      var removed = chunk.file1
      var added   = chunk.file2
      str.push("@ " + (added.offset + 1))
      var preContextRange = [removed.offset - 3, removed.offset]
      var preContext = diff.lines1.slice(preContextRange[0], preContextRange[1])
      _(preContext).each(function(line, i) {
        var lineIxOld = preContextRange[0] + i + 1
        var lineIxNew = lineIxOld + fileOffset
        str.push("<pre class='context'>" + lineIxOld.toString().rjust(2, " ") + " " + lineIxNew.toString().rjust(2, " ") + "  " + line + "</pre>")
      })
      if (removed.length > 0) {
        _(removed.chunk).each(function(line, i) {
          var lineIxOld = removed.offset + i + 1
          var lineIxNew = lineIxOld + fileOffset
          str.push("<pre class='removed'>" + lineIxOld.toString().rjust(2, " ") + "    -" + line + "</pre>")
        })
      }
      if (added.length > 0) {
        _(added.chunk).each(function(line, i) {
          var lineIxOld = added.offset + i + 1
          var lineIxNew = lineIxOld + fileOffset
          str.push("<pre class='added'>" + "   " + lineIxNew.toString().rjust(2, " ") + " +" + line + "</pre>")
        })
      }
      var postContextRange = [added.offset + 1 - totalRemoved, added.offset + 3 + 1 - totalRemoved]
      fileOffset += added.length - removed.length
      var postContext = diff.lines1.slice(postContextRange[0], postContextRange[1])
      _(postContext).each(function(line, i) {
        var lineIxOld = postContextRange[0] + i + 1
        var lineIxNew = lineIxOld + fileOffset
        str.push("<pre class='context'>" + lineIxOld.toString().rjust(2, " ") + " " + lineIxNew.toString().rjust(2, " ") + "  " + line + "</pre>")
      })
      totalRemoved += removed.length
    })
    str.push("</div>")
    return str.join("\n")
  }
}