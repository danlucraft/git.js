var fs   = require('fs')
var path = require('path')

Git.PackFile = function(repo, sha) {
  var that = this
  that.repo = repo
  that.sha = sha
  
  that.getPackIndex = function(callback) {
    var packPath = path.join(repo.gitDir, "objects/pack/pack-" + sha + ".idx")
    fs.readFile(packPath, function(err, data) {
      var string = data.toString("binary")
      callback(new Git.PackIndex(string))
    })
  }
  
  that.getPack = function(callback) {
    var packPath = path.join(repo.gitDir, "objects/pack/pack-" + sha + ".pack")
    fs.readFile(packPath, function(err, data) {
      var string = data.toString("binary")
      callback(new Git.Pack(string))
    })
  }
  
  that.getObject = function(sha, callback) {
    that.getPackIndex(function(packIndex) {
      var offset = packIndex.getOffset(sha)
      if (offset) {
        that.getPack(function(pack) {
          var object = pack.getObjectAtOffset(offset)
          callback(object)
        })
      } else {
        callback(null)
      }
    })
  }
}