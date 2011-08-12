var fs   = require('fs')
  , path = require('path')
  , PackIndex   = require('./pack_index')
  , Pack    = require('./pack')

var PackFile = function(repo, sha) {
  var that = this
  this.repo = repo
  this.sha = sha
}

PackFile.prototype.getPackIndex = function(callback) {
  var packPath = path.join(this.repo.gitDir, "objects/pack/pack-" + this.sha + ".idx")
  fs.readFile(packPath, function(err, data) {
    var string = data.toString("binary")
    callback(new PackIndex(string))
  })
}

PackFile.prototype.getPack = function(callback) {
  var packPath = path.join(this.repo.gitDir, "objects/pack/pack-" + this.sha + ".pack")
  fs.readFile(packPath, function(err, data) {
    var string = data.toString("binary")
    callback(new Pack(string))
  })
}

PackFile.prototype.getObject = function(sha, callback) {
  var self = this
  self.getPackIndex(function(packIndex) {
    var offset = packIndex.getOffset(sha)
    if (offset) {
      self.getPack(function(pack) {
        var object = pack.getObjectAtOffset(offset)
        callback(object)
      })
    } else {
      callback(null)
    }
  })
}

module.exports = exports = PackFile
