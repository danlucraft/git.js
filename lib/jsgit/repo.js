var path = require('path')
var fs   = require('fs')

// This class encapsulates an on-disk Repo
JsGit.Repo = function(dir) {
  var that = {}
  that.dir = dir
  that.gitDir = path.join(dir, ".git")
  
  if (!path.existsSync(that.dir)) {
    throw "Error: " + that.dir + " does not exist"
  }
  
  if (!path.existsSync(that.gitDir)) {
    throw "Error: " + that.gitDir + " does not exist"
  }
  
  // If an object exists loose, returns it. Otherwise, returns null
  that.getLooseObject = function(sha, callback) {
    if (sha == "" || !sha) { return callback(null) }
    var objectPath = path.join(dir, ".git/objects/" + sha.slice(0, 2) + "/" + sha.slice(2))
    fs.readFile(objectPath, function(err, data) {
      if (err) {
        callback(null)
      } else {
        var compressedData = data.toString('binary')
        var deflated = JsGit.stripZlibHeader(JsGit.stringToBytes(compressedData))
        var uncompressedData = new BinaryFile(RawDeflate.inflate(JsGit.bytesToString(deflated)).toString())
        var result = JsGit.bytesToString(uncompressedData.slice(0))
        var obj = JsGit.objects.make(sha, result.slice(0, 4), result.slice(5))
        callback(obj)
      }
    })
  }
  
  // Calls callback with each packFile in the repo
  that.eachPackFile = function(callback) {
  }

  // Get the object with the specified sha, or null if it doesn't exist in 
  // this repo.
  that.getObject = function(sha, callback) {
    if (sha == "" || !sha) { return callback(null) }
    
    that.getLooseObject(sha, function(object) {
      if (object) {
        callback(object)
      }
    })
    // if (obj) {
    //   return obj
    // } else {
    //   eachPackFile(function(packFile) {
    //     var obj = packFile.getObject(sha)
    //     if (obj) {
    //       return obj
    //     }
    //   })
    // }
    return null
  }
  return that
}