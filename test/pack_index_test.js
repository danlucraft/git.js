require('../lib/git-server')

var fs = require('fs')

var fixturePackIndex = function() {
  var arr = eval(fs.readFileSync("test/fixtures/pack_index.json").toString('binary'))
  return Git.bytesToString(arr)
}

exports.PackIndex = {
  "getOffset": function(test) {
    var packIndex = new Git.PackIndex(fixturePackIndex())
    test.equal(packIndex.getOffset("d3e1f6c063d0e579ce8b7f85324996c57b87fdcf"), 10229)
    test.done()
  },
  
  "getCrc": function(test) {
    var packIndex = new Git.PackIndex(fixturePackIndex())
    test.equal(packIndex.getCrc("d3e1f6c063d0e579ce8b7f85324996c57b87fdcf"), 2262964883)
    test.done()
  },
  
  "estimatedPackFileSize" : function(test) {
    var packIndex = new Git.PackIndex(fixturePackIndex())
    test.equal(packIndex.estimatedPackFileSize(), 18056)
    test.done()
  },
  
  "has64bOffsets" : function(test) {
    var packIndex = new Git.PackIndex(fixturePackIndex())
    test.equal(packIndex.has64bOffsets(), false)
    test.done()
  },
  
  "num objects": function(test) {
    var packIndex = new Git.PackIndex(fixturePackIndex())
    test.equal(packIndex.numObjects(), 124)
    test.done()
  },
  
  "fanout": function(test) {
    var packIndex = new Git.PackIndex(fixturePackIndex())
    test.equal(packIndex.fanout("d3e1f6c063d0e579ce8b7f85324996c57b87fdcf"), 97)
    test.equal(packIndex.fanout("00e1f6c063d0e579ce8b7f85324996c57b87fdcf"), 0)
    test.done()
  },
  
  "indexOfSha": function(test) {
    var packIndex = new Git.PackIndex(fixturePackIndex())
    test.equal(packIndex.indexOfSha("d3e1f6c063d0e579ce8b7f85324996c57b87fdcf"), 97)
    test.equal(packIndex.indexOfSha("0d91a54c7d439e84e3dd17d3594f1b2b6737f430"), 8)
    test.equal(packIndex.indexOfSha("0d91aXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"), null)
    test.done()
  },
  
  "shaAtIndex": function(test) {
    var packIndex = new Git.PackIndex(fixturePackIndex())
    test.equal(packIndex.shaAtIndex(1), "00c0b86e8a129e66ed0f5e6c85322b71e289d4cb")
    test.equal(packIndex.shaAtIndex(5), "0c62199f16ac1e2d7f7ae75b420c1231325dff4e")
    test.done()
  }
}

exports.PackIndexHelpers = {
  "assertVersion": function(test) {
    test.equal(Git.PackIndex.assertVersion([1,1,1,1,0,0,0,2,1,1,1,1], 2), true)
    test.equal(Git.PackIndex.assertVersion([1,1,1,1,0,0,0,2,1,1,1,1], 3), false)
    test.equal(Git.PackIndex.assertVersion([1,1,1,1,0,0,0,3,1,1,1,1], 1), false)
    test.done()
  }
}
