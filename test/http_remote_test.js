require('../lib/jsgit-server')

var REMOTE_TEST_DATA = {
  infoRefs: {
    data: "8c8d26e2f993c2c0112f5637cb05f06a95af34d8\trefs/heads/dbl-extract-models\n2d2d022c9955efc58bec5232116935de719efda4\trefs/heads/master\n",
    result: {
      "refs/heads/dbl-extract-models": "8c8d26e2f993c2c0112f5637cb05f06a95af34d8",
      "refs/heads/master": "2d2d022c9955efc58bec5232116935de719efda4"
    }
  }
}

exports.HttpRemote = {
  testParseDumbInfoRefs: function(test) {
    test.deepEqual(
      JsGit.HttpRemote.parseInfoRefs(REMOTE_TEST_DATA.infoRefs.data),
      REMOTE_TEST_DATA.infoRefs.result
    )
    test.done()
  }
}
  