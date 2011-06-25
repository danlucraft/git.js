var path = require('path')
var fs   = require('fs')
var util = require('util')

// This class encapsulates an on-disk Repo
Git.Repo = function(gitDir) {
  var that    = {}
  that.dir    = path.join(gitDir, "..")
  that.gitDir = gitDir
  
  if (!path.existsSync(that.dir)) {
    throw "Error: " + that.dir + " does not exist"
  }
  
  if (!path.existsSync(that.gitDir)) {
    throw "Error: " + that.gitDir + " does not exist"
  }
  
  var firstIndexOfByte = function(bytes, b) {
    var i = 0
    while (bytes.getByteAt(i) != b) i += 1
    return i  
  }
  
  // If an object exists loose, returns it. Otherwise, returns null
  that.getLooseObject = function(sha, callback) {
    if (sha == "" || !sha) { return callback(err, null) }
    
    var objectPath = path.join(that.gitDir, "/objects/" + sha.slice(0, 2) + "/" + sha.slice(2))
    
    fs.readFile(objectPath, function(err, data) {
      if (err) return callback(null, null)
      
      var compressedData = data.toString('binary')
      var deflated = Git.stripZlibHeader(Git.stringToBytes(compressedData))
      var uncompressedData = new BinaryFile(RawDeflate.inflate(Git.bytesToString(deflated)).toString())
      var result = Git.bytesToString(uncompressedData.slice(0))
      var objectType = result.slice(0, 4)
      var objectData = result.slice(firstIndexOfByte(uncompressedData, 0) + 1)
      var obj = Git.objects.make(sha, objectType, objectData)
        
      callback(null, obj)
    })
  }
  
  // Calls callback with a list of PackFiles
  that.getPackFiles = function(callback) {
    fs.readdir(path.join(that.gitDir, "/objects/pack"), function(err, files) {
      var packFiles = []
      files.forEach(function(file) {
        var match = /pack-(.*)\.idx/.exec(file)
        if (match) {
          packFiles.push(new Git.PackFile(that, match[1]))
        }
      })
      callback(packFiles)
    })
  }

  // Get the object with the specified sha, or null if it doesn't exist in 
  // this repo.
  // callback takes (err, object)
  that.getObject = function(sha, callback) {
    if (sha == "" || !sha)     return callback(null)
    if (sha.slice(-1) == "\n") sha = sha.slice(0, sha.length - 1)
    
    that.getLooseObject(sha, function(err, object) {
      if (err) return callback(err)
      
      if (object) {
        return callback(null, object)
      } else {
        that.getPackFiles(function(packFiles) {
          for(var i = 0; i < packFiles.length; i++) {
            ;(function(ix) {
              packFiles[ix].getObject(sha, function(object) {
                if (object) {
                  return callback(null, object)
                } else {
                  if (ix == packFiles.length - 1 ) {
                    return callback(null, null)
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
  
  // Get an array of heads [[name, sha], ...]. 
  // Callback receives(err, data)
  that.getBranches = function(cb) {
    var headsDir = path.join(that.gitDir, "/refs/heads")
    var result = {branchNames: []}
    return fs.readdir(headsDir, parseLooseHeadFiles)
    
    function parseLooseHeadFiles(err, files) {
      if (err) return cb(err)
      if (files.length == 0) return parsePackedRefFile()
      
      for(var i = 0; i < files.length; i++) {
        (function(ix) {
          var headPath = path.join(headsDir, files[ix])
          return fs.readFile(headPath, function(err, contents) {
            if (!err) {
              result.branchNames.push(files[ix])
              result[files[ix]] = contents.toString("ascii")
            }
            if (ix == files.length - 1) {
              return parsePackedRefFile()
            }
          })
        })(i)
      }
    }
    
    function parsePackedRefFile() {
      var packedRefPath = path.join(that.gitDir, "/packed-refs")
      fs.readFile(packedRefPath, function(err, contents) {
        if (err) {
          if (err.code == "ENOENT") {
            return cb(null, result)
          } else {
            return cb(err)
          }
        }
        var lines = contents.toString("ascii").split("\n")
        for(var i = 0; i < lines.length; i++) {
          var line = lines[i]
          if (line.match(/^\s*#/) || line.match(/^\s*$/)) {
          } else {
            var bits = lines[i].split(" ")
            var sha = bits[0]
            var refPath = bits[1]
            var nameMatch = refPath.match(/^refs\/heads\/(.*)$/)
            if (nameMatch) {
              result.branchNames.push(nameMatch[1])
              result[nameMatch[1]] = sha
            }
          }
        }
        return cb(null, result)
      })
    }
  }
  
  // Get the current head. Callback receives (err, data)
  that.getHead = function(cb) {
    var headFile = path.join(that.gitDir, "/HEAD")
    fs.readFile(headFile, function(err, contents) {
      if (err) return cb(err)
      
      var head = contents.toString("ascii")
      var match = /ref: refs\/heads\/(.*)\n$/.exec(head)
      if (match) {
        cb(null, match[1])
      } else {
        cb(null, null)
      }
    })
  }
  
  return that
}



