var BinaryFile = require('../binary_file')
  , path = require('path')
  , fs   = require('fs')
  , utils = require('./utils')
  , PackFile = require('./pack-file')
  , inflate = require('./zlib').inflate
  , Objects = require('./objects')

var firstIndexOfByte = function(bytes, b) {
  var i = 0
  while (bytes.getByteAt(i) != b) i += 1
  return i
}

// This class encapsulates an on-disk Repo
var Repo = function(gitDir) {
  var that    = this 
  that.dir    = path.join(gitDir, "..")
  that.gitDir = gitDir

  if (!path.existsSync(that.dir)) {
    throw "Error: " + that.dir + " does not exist"
  }

  if (!path.existsSync(that.gitDir)) {
    throw "Error: " + that.gitDir + " does not exist"
  }
}

// If an object exists loose, returns it. Otherwise, returns null
Repo.prototype.getLooseObject = function(sha, callback) {
  var that = this
  if (sha == "" || !sha) { return callback(err, null) }

  var objectPath = path.join(that.gitDir, "/objects/" + sha.slice(0, 2) + "/" + sha.slice(2))

  fs.readFile(objectPath, function(err, data) {
    if (err) return callback(null, null)

    var compressedData = data.toString('binary')

    inflate(compressedData, 2, function(err, uncompressedData) {
      uncompressedData = new BinaryFile(uncompressedData)

      var result = utils.bytesToString(uncompressedData.slice(0))
      var objectType = result.slice(0, 4)
      var objectData = result.slice(firstIndexOfByte(uncompressedData, 0) + 1)
      var obj = Objects.make(sha, objectType, objectData)
      callback(null, obj)
    })

  })
}

// Calls callback with a list of PackFiles
Repo.prototype.getPackFiles = function(callback) {
  var that = this
  fs.readdir(path.join(that.gitDir, "/objects/pack"), function(err, files) {
    var packFiles = []
    files.forEach(function(file) {
      var match = /pack-(.*)\.idx/.exec(file)
      if (match) {
        packFiles.push(new PackFile(that, match[1]))
      }
    })
    callback(err, packFiles)
  })
}

// Get the object with the specified sha, or null if it doesn't exist in
// this repo.
// callback takes (err, object)
Repo.prototype.getObject = function(sha, callback) {
  var that = this
  if (sha == "" || !sha)     return callback(null)
  if (sha.slice(-1) == "\n") sha = sha.slice(0, sha.length - 1)

  that.getLooseObject(sha, function(err, object) {
    if (err) return callback(err)

    if (object) {
      return callback(null, object)
    } else {
      that.getPackFiles(function(err, packFiles) {
        for(var i = 0; i < packFiles.length; i++) {
          ;(function(ix) {
            packFiles[ix].getObject(sha, function(err, object) {
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
Repo.prototype.getBranches = function(cb) {
  var that = this
  var headsDir = path.join(that.gitDir, "/refs/heads")
  var result = {branchNames: []}

  return fs.readdir(headsDir, parseLooseHeadFiles.bind(this, parsePackedRefFile, ''))

  function parseLooseHeadFiles(done, parent, err, files) {
    if (err) return cb(err)
    if (files.length == 0) return parsePackedRefFile()

    var readyCount = files.length;

    for(var i = 0; i < files.length; i++) {
      (function(ix) {
        var headPath = path.join(headsDir, parent, files[ix])
        fs.stat(headPath, function(err, stat) {
          if(!err) {
            if(stat.isFile()) {
              fs.readFile(headPath, function(err, contents) {
                if (!err) {
                  result.branchNames.push(path.join(parent, files[ix]))
                  result[path.join(parent, files[ix])] = contents.toString("ascii")
                }
                if (--readyCount === 0) {
                  return done()
                }
              })
            } else {
              fs.readdir(headPath, parseLooseHeadFiles.bind(this, function() {
                if (--readyCount === 0) {
                  return done()
                }
              }, path.join(parent, files[ix])));
            }
          } 
        });


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
Repo.prototype.getHead = function(cb) {
  var that = this
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

module.exports = exports = Repo
