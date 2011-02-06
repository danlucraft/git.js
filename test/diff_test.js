
require('../lib/jsgit-server')



exports.Diff = {
  "diffs files correctly with additions": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "c", "d", "e", "f", "g", "h"].join("\n")
    var diff = new JsGit.Diff(file1, file2)
    diff.toHtml()
    test.done()
  }
}
  