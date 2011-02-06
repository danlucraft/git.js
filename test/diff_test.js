
require('../lib/jsgit-server')



exports.DiffAdditions = {
  "diffs files correctly with additions at end": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "c", "d", "e", "f", "g", "h"].join("\n")
    var diff = new JsGit.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 7, 
        lines: [
          {oldIndex: 4, newIndex: 4, line: "d", type:"context"},
          {oldIndex: 5, newIndex: 5, line: "e", type:"context"},
          {oldIndex: 6, newIndex: 6, line: "f", type:"context"},
          {oldIndex: null, newIndex: 7, line: "g", type:"added"},
          {oldIndex: null, newIndex: 8, line: "h", type:"added"}
        ]}])
    test.done()
  },
  
  "diffs files correctly with additions at beginning": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["0", "1", "a", "b", "c", "d", "e", "f"].join("\n")
    var diff = new JsGit.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 1, 
        lines: [
          {oldIndex: null, newIndex: 1, line: "0", type:"added"},
          {oldIndex: null, newIndex: 2, line: "1", type:"added"},
          {oldIndex: 1, newIndex: 3, line: "a", type:"context"},
          {oldIndex: 2, newIndex: 4, line: "b", type:"context"},
          {oldIndex: 3, newIndex: 5, line: "c", type:"context"}
        ]}])
    test.done()
  },
  
  "diffs files correctly with additions in middle": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "c", "0", "1", "d", "e", "f"].join("\n")
    var diff = new JsGit.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 4, 
        lines: [
          {oldIndex: 1, newIndex: 1, line: "a", type:"context"},
          {oldIndex: 2, newIndex: 2, line: "b", type:"context"},
          {oldIndex: 3, newIndex: 3, line: "c", type:"context"},
          {oldIndex: null, newIndex: 4, line: "0", type:"added"},
          {oldIndex: null, newIndex: 5, line: "1", type:"added"},
          {oldIndex: 4, newIndex: 6, line: "d", type:"context"},
          {oldIndex: 5, newIndex: 7, line: "e", type:"context"},
          {oldIndex: 6, newIndex: 8, line: "f", type:"context"}
        ]}])
    test.done()
  }
}

exports.DiffRemoved = {
  "diffs files correctly with removals at end": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "c", "d"].join("\n")
    var diff = new JsGit.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 5, 
        lines: [
          {oldIndex: 2, newIndex: 2, line: "b", type:"context"},
          {oldIndex: 3, newIndex: 3, line: "c", type:"context"},
          {oldIndex: 4, newIndex: 4, line: "d", type:"context"},
          {oldIndex: 5, newIndex: null, line: "e", type:"removed"},
          {oldIndex: 6, newIndex: null, line: "f", type:"removed"}
        ]}])
    test.done()
  },
  
  "diffs files correctly with removals at beginning": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["c", "d", "e", "f"].join("\n")
    var diff = new JsGit.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 1, 
        lines: [
          {oldIndex: 1, newIndex: null, line: "a", type:"removed"},
          {oldIndex: 2, newIndex: null, line: "b", type:"removed"},
          {oldIndex: 3, newIndex: 1, line: "c", type:"context"},
          {oldIndex: 4, newIndex: 2, line: "d", type:"context"},
          {oldIndex: 5, newIndex: 3, line: "e", type:"context"},
        ]}])
    test.done()
  },
  
}




