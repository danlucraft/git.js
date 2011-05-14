var path = require('path')
var fs   = require('fs')

// This class encapsulates an on-disk Repo
JsGit.Repo = function(gitDir) {
  var that    = {}
  that.dir    = path.join(gitDir, "..")
  that.gitDir = gitDir
  
  if (!path.existsSync(that.dir)) {
    throw "Error: " + that.dir + " does not exist"
  }
  
  if (!path.existsSync(that.gitDir)) {
    throw "Error: " + that.gitDir + " does not exist"
  }
  
  // If an object exists loose, returns it. Otherwise, returns null
  that.getLooseObject = function(sha, callback) {
    if (sha == "" || !sha) { return callback(null) }
    var objectPath = path.join(that.gitDir, "/objects/" + sha.slice(0, 2) + "/" + sha.slice(2))
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
  
  // Calls callback with a list of PackFiles
  that.getPackFiles = function(callback) {
    fs.readdir(path.join(that.gitDir, "/objects/pack"), function(err, files) {
      var packFiles = []
      files.forEach(function(file) {
        var match = /pack-(.*)\.idx/.exec(file)
        if (match) {
          packFiles.push(new JsGit.PackFile(that, match[1]))
        }
      })
      callback(packFiles)
    })
  }

  // Get the object with the specified sha, or null if it doesn't exist in 
  // this repo.
  that.getObject = function(sha, callback) {
    if (sha == "" || !sha) { return callback(null) }
    
    that.getLooseObject(sha, function(object) {
      if (object) {
        callback(object)
      } else {
        that.getPackFiles(function(packFiles) {
          for(var i = 0; i < packFiles.length; i++) {
            (function(ix) {
              packFiles[ix].getObject(sha, function(object) {
                if (object) {
                  callback(object)
                } else {
                  if (ix == packFiles.length - 1 ) {
                    callback(null)
                  }
                }
              })
            })(i)
          }
        })
      }
    })
    return null
  }
  return that
}