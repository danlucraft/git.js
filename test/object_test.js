var Objects = require('../lib/git/objects')
  , utils = require('../lib/git/utils')
  ;
require('../lib/string_helpers');

exports.Blob = {
  "has basic data": function(test) {
    var blob = new Objects.Blob("sha123", "// An example JavaScript file")
    test.equals(blob.sha, "sha123")
    test.equals(blob.type, "blob")
    test.equals(blob.data, "// An example JavaScript file")
    test.done()
  }
}

var testCommitData = [116, 114, 101, 101, 32, 99, 52, 52, 57, 52, 50, 97, 57, 53, 57, 97, 56, 50, 50, 97, 51, 97, 55, 56, 53, 101, 100, 55, 99, 52, 97, 54, 53, 56, 100, 98, 57, 54, 57, 48, 100, 100, 49, 55, 53, 10, 97, 117, 116, 104, 111, 114, 32, 68, 97, 110, 105, 101, 108, 32, 76, 117, 99, 114, 97, 102, 116, 32, 60, 100, 97, 110, 64, 102, 108, 117, 101, 110, 116, 114, 97, 100, 105, 99, 97, 108, 46, 99, 111, 109, 62, 32, 49, 50, 57, 51, 52, 53, 52, 55, 53, 51, 32, 43, 48, 48, 48, 48, 10, 99, 111, 109, 109, 105, 116, 116, 101, 114, 32, 68, 97, 110, 105, 101, 108, 32, 76, 117, 99, 114, 97, 102, 116, 32, 60, 100, 97, 110, 64, 102, 108, 117, 101, 110, 116, 114, 97, 100, 105, 99, 97, 108, 46, 99, 111, 109, 62, 32, 49, 50, 57, 51, 52, 53, 52, 55, 53, 51, 32, 43, 48, 48, 48, 48, 10, 10, 65, 100, 100, 32, 115, 97, 109, 112, 108, 101, 32, 102, 105, 108, 101, 115, 10]

exports.Commit = {
  "has basic data": function(test) {
    var commit = new Objects.Commit("sha123", utils.bytesToString(testCommitData))
    
    test.equals(commit.sha, "sha123")
    test.equals(commit.type, "commit")
    test.equals(commit.data, utils.bytesToString(testCommitData))
    test.done()
  },
  
  "has commit information": function(test) {
    var commit = new Objects.Commit("sha123", utils.bytesToString(testCommitData))
    
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
var treeContainingDifferentModes =
    "100644 diff.js" +
    unescape('%00%5E%C2%A0_%8D%8E%A0W%5C0%C0%1A%95%F1h%08%3F%8E%1A%A2') +
    "100644 grack.rb" +
    unescape('%00%8FdX%ACj%7EW%FC%26%B4%F7%E7A%D7%AE%CA%15Afg') +
    "40000 js-deflate" +
    unescape('%00U%84%3B%02%81%86n%D1q%D7%F5%05%119w%D6%DA%CDHJ') +
    "100644 md5.js" +
    unescape('%00%BC%BA%D9%07%F9%F7%18%F33%AB*%FD%C3v%D9%8D%13%5B%CC%8D') +
    "100755 sha1.js" +
    unescape('%00%E0%C2%85%DB%8DER%E1o%1B%9A%9E.%EDw%02%BFx%ACf') +
    "100644 sha2.js" +
    unescape('%00%20l%AA%10%F1%0D%8A%05%CD%03t%B8%18%24%3A%82%25U%AA%9F') +
    "40000 syntaxhighlighter_3.0.83" +
    unescape('%00%F3%1E%C3%9E%D0%16fo%BF%AE%DF%BF-%FB%3BX%CF%D0k%FE') +
    "100644 underscore-min.js" +
    unescape('%00%29y%24%3E%08%E9%DB%0E%AE1%DB%E1%90%07%7Eu%24%B7kv');


exports.Tree = {
  "has basic data": function(test) {
    var tree = new Objects.Tree("sha123", utils.bytesToString(testTreeData))
    test.equals(tree.sha, "sha123")
    test.equals(tree.type, "tree")
    test.equals(tree.data, utils.bytesToString(testTreeData))
    test.done()
  },
  
  "has contents": function(test) {
    var tree = new Objects.Tree("sha123", utils.bytesToString(testTreeData))
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
  },
  "tree with file modes other than 0644": function(test) {
    var tree = new Objects.Tree(
        "22a9bcd014e8727f70a9e875cf8e19ddf940f485",
        treeContainingDifferentModes);
    test.deepEqual(
        tree.contents,
        [ { mode: '100644',
            name: 'diff.js',
            sha: '5ec2a05f8d8ea0575c30c01a95f168083f8e1aa2',
            type: 'blob' },
          { mode: '100644',
            name: 'grack.rb',
            sha: '8f6458ac6a7e57fc26b4f7e741d7aeca15416667',
            type: 'blob' },
          { mode: '040000',
            name: 'js-deflate',
            sha: '55843b0281866ed171d7f505113977d6dacd484a',
            type: 'tree' },
          { mode: '100644',
            name: 'md5.js',
            sha: 'bcbad907f9f718f333ab2afdc376d98d135bcc8d',
            type: 'blob' },
          { mode: '100755',
            name: 'sha1.js',
            sha: 'e0c285db8d4552e16f1b9a9e2eed7702bf78ac66',
            type: 'blob' },
          { mode: '100644',
            name: 'sha2.js',
            sha: '206caa10f10d8a05cd0374b818243a822555aa9f',
            type: 'blob' },
          { mode: '040000',
            name: 'syntaxhighlighter_3.0.83',
            sha: 'f31ec39ed016666fbfaedfbf2dfb3b58cfd06bfe',
            type: 'tree' },
          { mode: '100644',
            name: 'underscore-min.js',
            sha: '2979243e08e9db0eae31dbe190077e7524b76b76',
            type: 'blob' } ])
    test.done();
  }
}

