require('../lib/jsgit-server')

var fs = require('fs')

var dataUploadPack1 = function() {
  var arr = eval(fs.readFileSync("test/fixtures/upload_pack1.json").toString('binary'))
  return JsGit.bytesToString(arr)
}

exports.PackFileParser = {
  "has basic data": function(test) {
    var uploadPackParser = new JsGit.UploadPackParser(dataUploadPack1())
    uploadPackParser.parse()
    test.deepEqual(uploadPackParser.getObjects(), [])
    test.done()
  }
}
