
require('../lib/git-server')

exports.Blob = {
  "has basic data": function(test) {
    var blob = new Git.objects.Blob("sha123", "// An example JavaScript file")
    test.equals(blob.sha, "sha123")
    test.equals(blob.type, "blob")
    test.equals(blob.data, "// An example JavaScript file")
    test.done()
  }
}

var testCommitData = [116, 114, 101, 101, 32, 99, 52, 52, 57, 52, 50, 97, 57, 53, 57, 97, 56, 50, 50, 97, 51, 97, 55, 56, 53, 101, 100, 55, 99, 52, 97, 54, 53, 56, 100, 98, 57, 54, 57, 48, 100, 100, 49, 55, 53, 10, 97, 117, 116, 104, 111, 114, 32, 68, 97, 110, 105, 101, 108, 32, 76, 117, 99, 114, 97, 102, 116, 32, 60, 100, 97, 110, 64, 102, 108, 117, 101, 110, 116, 114, 97, 100, 105, 99, 97, 108, 46, 99, 111, 109, 62, 32, 49, 50, 57, 51, 52, 53, 52, 55, 53, 51, 32, 43, 48, 48, 48, 48, 10, 99, 111, 109, 109, 105, 116, 116, 101, 114, 32, 68, 97, 110, 105, 101, 108, 32, 76, 117, 99, 114, 97, 102, 116, 32, 60, 100, 97, 110, 64, 102, 108, 117, 101, 110, 116, 114, 97, 100, 105, 99, 97, 108, 46, 99, 111, 109, 62, 32, 49, 50, 57, 51, 52, 53, 52, 55, 53, 51, 32, 43, 48, 48, 48, 48, 10, 10, 65, 100, 100, 32, 115, 97, 109, 112, 108, 101, 32, 102, 105, 108, 101, 115, 10]

exports.Commit = {
  "has basic data": function(test) {
    var commit = new Git.objects.Commit("sha123", Git.bytesToString(testCommitData))
    
    test.equals(commit.sha, "sha123")
    test.equals(commit.type, "commit")
    test.equals(commit.data, Git.bytesToString(testCommitData))
    test.done()
  },
  
  "has commit information": function(test) {
    var commit = new Git.objects.Commit("sha123", Git.bytesToString(testCommitData))
    
    test.equals(commit.tree, "c44942a959a822a3a785ed7c4a658db9690dd175")
    test.equals(commit.author.name, "Daniel Lucraft")
    test.equals(commit.author.timestamp, "1293454753")
    test.equals(commit.author.email, "dan@fluentradical.com")
    test.equals(commit.committer.name, "Daniel Lucraft")
    test.equals(commit.committer.timestamp, "1293454753")
    test.equals(commit.committer.email, "dan@fluentradical.com")
    test.equals(commit.message, "Add sample files")
    test.done()
  }
  
}

var testTreeData = [49, 48, 48, 54, 52, 52, 32, 82, 69, 65, 68, 77, 69, 0, 253, 42, 29, 136, 176, 13, 132, 1, 192, 144, 127, 195, 226, 211, 226, 95, 1, 187, 82, 231, 52, 48, 48, 48, 48, 32, 108, 105, 98, 0, 174, 81, 21, 150, 227, 142, 214, 117, 219, 6, 3, 161, 52, 78, 78, 234, 47, 25, 70, 52]

exports.Tree = {
  "has basic data": function(test) {
    var tree = new Git.objects.Tree("sha123", Git.bytesToString(testTreeData))
    test.equals(tree.sha, "sha123")
    test.equals(tree.type, "tree")
    test.equals(tree.data, Git.bytesToString(testTreeData))
    test.done()
  },
  
  "has contents": function(test) {
    var tree = new Git.objects.Tree("sha123", Git.bytesToString(testTreeData))
    test.deepEqual(tree.contents, 
      [
        {
          mode: "100644",
          name: "README",
          type: "blob",
          sha: "fd2a1d88b00d8401c0907fc3e2d3e25f01bb52e7"
        },
        {
          mode: "040000",
          name: "lib",
          type: "tree",
          sha: "ae511596e38ed675db0603a1344e4eea2f194634"
        }
      ])
    test.done()
  }
}