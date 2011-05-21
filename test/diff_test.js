
require('../lib/git-server')

exports.NullEndpoints = {
  "null start": function(test) {
    var file1 = ""
    var file2 = ["a", "b", "c"].join("\n")
    var diff = new Git.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 1, 
        lines: [
          {oldIndex: null, newIndex: 1, line: "a", type:"added"},
          {oldIndex: null, newIndex: 2, line: "b", type:"added"},
          {oldIndex: null, newIndex: 3, line: "c", type:"added"}
        ]}])
    test.done()
  },
  "null end": function(test) {
    var file1 = ["a", "b", "c"].join("\n")
    var file2 = ""
    var diff = new Git.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 1, 
        lines: [
          {oldIndex: 1, newIndex: null, line: "a", type:"removed"},
          {oldIndex: 2, newIndex: null, line: "b", type:"removed"},
          {oldIndex: 3, newIndex: null, line: "c", type:"removed"}
        ]}])
    test.done()
  }
}
  
exports.SingleHunk = {
  "additions at end": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "c", "d", "e", "f", "g", "h"].join("\n")
    var diff = new Git.Diff(file1, file2)
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
  
  "additions at beginning": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["0", "1", "a", "b", "c", "d", "e", "f"].join("\n")
    var diff = new Git.Diff(file1, file2)
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
  
  "additions in middle": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "c", "0", "1", "d", "e", "f"].join("\n")
    var diff = new Git.Diff(file1, file2)
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
  },
  
  "removals at end": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "c", "d"].join("\n")
    var diff = new Git.Diff(file1, file2)
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
  
  "removals at beginning": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["c", "d", "e", "f"].join("\n")
    var diff = new Git.Diff(file1, file2)
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
  
  "removals in middle": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "e", "f"].join("\n")
    var diff = new Git.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 3, 
        lines: [
          {oldIndex: 1, newIndex: 1, line: "a", type:"context"},
          {oldIndex: 2, newIndex: 2, line: "b", type:"context"},
          {oldIndex: 3, newIndex: null, line: "c", type:"removed"},
          {oldIndex: 4, newIndex: null, line: "d", type:"removed"},
          {oldIndex: 5, newIndex: 3, line: "e", type:"context"},
          {oldIndex: 6, newIndex: 4, line: "f", type:"context"},
        ]}])
    test.done()
  },
  
  "added and removed in middle of same length": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "0", "1", "e", "f"].join("\n")
    var diff = new Git.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 3, 
        lines: [
          {oldIndex: 1, newIndex: 1, line: "a", type:"context"},
          {oldIndex: 2, newIndex: 2, line: "b", type:"context"},
          {oldIndex: 3, newIndex: null, line: "c", type:"removed"},
          {oldIndex: 4, newIndex: null, line: "d", type:"removed"},
          {oldIndex: null, newIndex: 3, line: "0", type:"added"},
          {oldIndex: null, newIndex: 4, line: "1", type:"added"},
          {oldIndex: 5, newIndex: 5, line: "e", type:"context"},
          {oldIndex: 6, newIndex: 6, line: "f", type:"context"},
        ]}])
    test.done()
  },
  
  "more added than removed": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "0", "1", "2", "3", "e", "f"].join("\n")
    var diff = new Git.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 3, 
        lines: [
          {oldIndex: 1, newIndex: 1, line: "a", type:"context"},
          {oldIndex: 2, newIndex: 2, line: "b", type:"context"},
          {oldIndex: 3, newIndex: null, line: "c", type:"removed"},
          {oldIndex: 4, newIndex: null, line: "d", type:"removed"},
          {oldIndex: null, newIndex: 3, line: "0", type:"added"},
          {oldIndex: null, newIndex: 4, line: "1", type:"added"},
          {oldIndex: null, newIndex: 5, line: "2", type:"added"},
          {oldIndex: null, newIndex: 6, line: "3", type:"added"},
          {oldIndex: 5, newIndex: 7, line: "e", type:"context"},
          {oldIndex: 6, newIndex: 8, line: "f", type:"context"},
        ]}])
    test.done()
  },
  
  "more removed than added": function(test) {
    var file1 = ["a", "b", "c", "d", "e", "f"].join("\n")
    var file2 = ["a", "b", "0", "1", "f"].join("\n")
    var diff = new Git.Diff(file1, file2)
    test.deepEqual(
      diff.info, 
      [{offset: 3, 
        lines: [
          {oldIndex: 1, newIndex: 1, line: "a", type:"context"},
          {oldIndex: 2, newIndex: 2, line: "b", type:"context"},
          {oldIndex: 3, newIndex: null, line: "c", type:"removed"},
          {oldIndex: 4, newIndex: null, line: "d", type:"removed"},
          {oldIndex: 5, newIndex: null, line: "e", type:"removed"},
          {oldIndex: null, newIndex: 3, line: "0", type:"added"},
          {oldIndex: null, newIndex: 4, line: "1", type:"added"},
          {oldIndex: 6, newIndex: 5, line: "f", type:"context"},
        ]}])
    test.done()
  }
}

exports.MultipleSeparateHunks = {
  "added then added": function(test) {
    var file1 = "123456789".split("").join("\n")
    var file2 = "123xy4567zq89".split("").join("\n")
    var diff = new Git.Diff(file1, file2, {context: 1})
    test.deepEqual(
      diff.info[0], 
      {offset: 4, 
        lines: [
          {oldIndex: 3, newIndex: 3, line: "3", type:"context"},
          {oldIndex: null, newIndex: 4, line: "x", type:"added"},
          {oldIndex: null, newIndex: 5, line: "y", type:"added"},
          {oldIndex: 4, newIndex: 6, line: "4", type:"context"}
        ]})
    test.deepEqual(
      diff.info[1], 
      {offset: 10, 
        lines: [
          {oldIndex: 7, newIndex: 9, line: "7", type:"context"},
          {oldIndex: null, newIndex: 10, line: "z", type:"added"},
          {oldIndex: null, newIndex: 11, line: "q", type:"added"},
          {oldIndex: 8, newIndex: 12, line: "8", type:"context"}
        ]})
    test.done()
  },
  
  "removed then removed": function(test) {
    var file1 = "123456789".split("").join("\n")
    var file2 = "1345689".split("").join("\n")
    var diff = new Git.Diff(file1, file2, {context: 1})
    test.deepEqual(
      diff.info[0], 
      {offset: 2, 
        lines: [
          {oldIndex: 1, newIndex: 1, line: "1", type:"context"},
          {oldIndex: 2, newIndex: null, line: "2", type:"removed"},
          {oldIndex: 3, newIndex: 2, line: "3", type:"context"}
        ]})
    test.deepEqual(
      diff.info[1], 
      {offset: 6, 
        lines: [
          {oldIndex: 6, newIndex: 5, line: "6", type:"context"},
          {oldIndex: 7, newIndex: null, line: "7", type:"removed"},
          {oldIndex: 8, newIndex: 6, line: "8", type:"context"}
        ]})
    test.done()
  },
  
  "added then removed": function(test) {
    var file1 = "123456789".split("").join("\n")
    var file2 = "123xy45689".split("").join("\n")
    var diff = new Git.Diff(file1, file2, {context: 1})
    test.deepEqual(
      diff.info[0], 
      {offset: 4, 
        lines: [
          {oldIndex: 3, newIndex: 3, line: "3", type:"context"},
          {oldIndex: null, newIndex: 4, line: "x", type:"added"},
          {oldIndex: null, newIndex: 5, line: "y", type:"added"},
          {oldIndex: 4, newIndex: 6, line: "4", type:"context"}
        ]})
    test.deepEqual(
      diff.info[1], 
      {offset: 9, 
        lines: [
          {oldIndex: 6, newIndex: 8, line: "6", type:"context"},
          {oldIndex: 7, newIndex: null, line: "7", type:"removed"},
          {oldIndex: 8, newIndex: 9, line: "8", type:"context"}
        ]})
    test.done()
  },
  
  "removed then added": function(test) {
    var file1 = "123456789".split("").join("\n")
    var file2 = "134567xq89".split("").join("\n")
    var diff = new Git.Diff(file1, file2, {context: 1})
    test.deepEqual(
      diff.info[0], 
      {offset: 2, 
        lines: [
          {oldIndex: 1, newIndex: 1, line: "1", type:"context"},
          {oldIndex: 2, newIndex: null, line: "2", type:"removed"},
          {oldIndex: 3, newIndex: 2, line: "3", type:"context"}
        ]})
    test.deepEqual(
      diff.info[1], 
      {offset: 7, 
        lines: [
          {oldIndex: 7, newIndex: 6, line: "7", type:"context"},
          {oldIndex: null, newIndex: 7, line: "x", type:"added"},
          {oldIndex: null, newIndex: 8, line: "q", type:"added"},
          {oldIndex: 8, newIndex: 9, line: "8", type:"context"}
        ]})
    test.done()
  }
}

exports.MultipleConnectedHunks = {
  "overlap by 1": function(test) {
    var file1 = "123456789".split("").join("\n")
    var file2 = "123xy4zq56789".split("").join("\n")
    var diff = new Git.Diff(file1, file2, {context: 1})
    test.equal(diff.info.length, 1)
    test.deepEqual(
      diff.info[0], 
      {offset: 4, 
        lines: [
          {oldIndex: 3, newIndex: 3, line: "3", type:"context"},
          {oldIndex: null, newIndex: 4, line: "x", type:"added"},
          {oldIndex: null, newIndex: 5, line: "y", type:"added"},
          {oldIndex: 4, newIndex: 6, line: "4", type:"context"},
          {oldIndex: null, newIndex: 7, line: "z", type:"added"},
          {oldIndex: null, newIndex: 8, line: "q", type:"added"},
          {oldIndex: 5, newIndex: 9, line: "5", type:"context"}
          ]})
    test.done()
  },
  
  "overlap by 2": function(test) {
    var file1 = "123456789".split("").join("\n")
    var file2 = "123xy4zq56789".split("").join("\n")
    var diff = new Git.Diff(file1, file2, {context: 2})
    test.equal(diff.info.length, 1)
    test.deepEqual(
      diff.info[0], 
      {offset: 4, 
        lines: [
          {oldIndex: 2, newIndex: 2, line: "2", type:"context"},
          {oldIndex: 3, newIndex: 3, line: "3", type:"context"},
          {oldIndex: null, newIndex: 4, line: "x", type:"added"},
          {oldIndex: null, newIndex: 5, line: "y", type:"added"},
          {oldIndex: 4, newIndex: 6, line: "4", type:"context"},
          {oldIndex: null, newIndex: 7, line: "z", type:"added"},
          {oldIndex: null, newIndex: 8, line: "q", type:"added"},
          {oldIndex: 5, newIndex: 9, line: "5", type:"context"},
          {oldIndex: 6, newIndex: 10, line: "6", type:"context"}
          ]})
    test.done()
  },
}


