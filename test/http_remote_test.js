require('../lib/git-server')

var REMOTE_TEST_DATA = {
  infoRefs: {
    data: "8c8d26e2f993c2c0112f5637cb05f06a95af34d8\trefs/heads/dbl-extract-models\n2d2d022c9955efc58bec5232116935de719efda4\trefs/heads/master\n",
    result: [
      {name: "refs/heads/dbl-extract-models", sha:"8c8d26e2f993c2c0112f5637cb05f06a95af34d8"},
      {name: "refs/heads/master", sha:"2d2d022c9955efc58bec5232116935de719efda4"}
    ]
  },
  commitObjectData: {
    data: [120, 1, 157, 142, 59, 106, 3, 49, 20, 0, 83, 235, 20, 175, 55, 4, 73, 171, 47, 152, 224, 202, 149, 
      187, 156, 224, 233, 233, 201, 17, 102, 165, 141, 86, 6, 31, 223, 11, 185, 65, 166, 156, 98, 24, 234, 235, 
      90, 39, 104, 107, 63, 230, 96, 6, 114, 41, 46, 78, 218, 148, 21, 107, 229, 85, 90, 100, 52, 197, 75, 42, 
      78, 169, 101, 73, 161, 120, 19, 83, 70, 177, 225, 224, 54, 65, 74, 99, 41, 57, 99, 8, 109, 8, 214, 19, 197, 
      146, 99, 80, 218, 105, 114, 58, 96, 202, 68, 70, 89, 20, 248, 156, 63, 125, 192, 55, 166, 81, 27, 194, 141, 
      177, 229, 209, 225, 188, 255, 137, 203, 222, 219, 253, 81, 233, 241, 73, 125, 253, 2, 165, 163, 116, 193, 
      89, 227, 225, 36, 15, 196, 97, 143, 207, 201, 255, 47, 136, 107, 125, 213, 118, 7, 220, 54, 110, 249, 8, 
      173, 191, 80, 27, 20, 198, 249, 28, 188, 139, 55, 216, 129, 82, 86]
  },
  packList: {
    data: "P pack-81a0a267d579c67e35e456a65aed6e96f6c87e23.pack\n\n",
    result: ["81a0a267d579c67e35e456a65aed6e96f6c87e23"]
  }
  
}

exports.HttpRemote = {
  testParseDumbInfoRefs: function(test) {
    test.deepEqual(
      Git.HttpRemote.parseInfoRefs(REMOTE_TEST_DATA.infoRefs.data),
      REMOTE_TEST_DATA.infoRefs.result
    )
    test.done()
  },

  testParseObjectData: function(test) {
    var commit = Git.HttpRemote.parseObjectData("123", Git.bytesToString(REMOTE_TEST_DATA.commitObjectData.data))
    test.equals(commit.type, "commit")
    test.equals(commit.sha, "123")
    test.equals(commit.tree, "c6b93605bd1e2171b3094f70cf61133b8f749bda")
    test.deepEqual(commit.parents, ["0045cb644ca58857cc9fd981262c628abdcc415a"])
    test.equals(commit.author.name, "Sabrina Leandro")
    test.equals(commit.committer.name, "Sabrina Leandro")
    test.equals(commit.message, "Fixing appender mq in features")
    test.done()
  },
  
  testParsePackList: function(test) {
    test.deepEqual(
      Git.HttpRemote.parsePackList(REMOTE_TEST_DATA.packList.data),
      REMOTE_TEST_DATA.packList.result
    )
    test.done()
  }
}
  