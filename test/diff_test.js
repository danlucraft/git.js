
require('../lib/jsgit-server')



exports.Diff = {
  "diffs files correctly with additions": function(test) {
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
  }
}
  