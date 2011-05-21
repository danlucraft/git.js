require('../lib/git-server')

var fs = require('fs')

var fixturePackFile = function() {
  var arr = eval(fs.readFileSync("test/fixtures/pack.json").toString('binary'))
  return Git.bytesToString(arr)
}

exports.PackFileParser = {
  "parses out objects": function(test) {
    var packFile = new Git.Pack(fixturePackFile())
    packFile.parseAll()
    test.equal(packFile.getObjects().length, 124)
    test.done()
  },
  
  "supports random access by offset": function(test) {
    var packFile = new Git.Pack(fixturePackFile())
    test.deepEqual(
      packFile.getObjectAtOffset(10229).id(), 
      { type: 'tree'
      , sha: 'd3e1f6c063d0e579ce8b7f85324996c57b87fdcf'
      , data: '40000 lib\u0000\u00ef\u00c8\u00e2\u0019]9\u00f6\u00f4W\u00ee\u0003\u00bcQ\u0096\u0096\u001e6\u00f7\u00b56100644 spec_helper.rb\u0000\u009e,R\u0098\u00f2\u00c0\u00c3T\u00baX,\u0099\u00017\u00ab\u009f\u00f4\u0002l\u00f5'
      , contents: 
         [ { mode: '040000'
           , name: 'lib'
           , type: 'tree'
           , sha: 'efc8e2195d39f6f457ee03bc5196961e36f7b536'
           }
         , { mode: '100644'
           , name: 'spec_helper.rb'
           , type: 'blob'
           , sha: '9e2c5298f2c0c354ba582c990137ab9ff4026cf5'
           }
         ]
      }
    )
    test.done()
  },
  
  "supports random access of delta objects by offset": function(test) {
    var packFile = new Git.Pack(fixturePackFile())
    var object = packFile.getObjectAtOffset(11633)
    test.equals(object.type, "blob")
    test.equals(object.sha, "88a9ba3a43861008a937d585583fa21ad0e8066f")
    test.equals(object.data.slice(0, 8), "require ")
    test.done()
  }
}
