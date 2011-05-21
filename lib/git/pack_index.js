
// This object partially parses the data contained in a pack-*.idx file, and provides
// access to the offsets of the objects the packfile and the crc checksums of the objects.
Git.PackIndex = function(data) {
  this.data = new BinaryFile(data)
  
  if (!Git.PackIndex.assertVersion(this.data, 2)) {
    throw(Error("pack index is not version 2"))
  }
  
  this.bytesToInteger = function(bytes) {
    var val = 0
    _(bytes).each(function(b) {
      val += b
      val *= 256
    })
    return val/256
  }
  
  this.bytesToSha = function(bytes) {
    return _(bytes).map(function(b) { return b.toString(16).rjust(2, "0")}).join("")
  }
  
  this.numObjects = function() {
    return this.bytesToInteger(this.data.slice(8 + 255*4, 8 + 255*4 + 4))
  }
  
  // Return the offset within the packfile of the object with the given sha.
  this.getOffset = function(sha) {
    var numObjects = this.numObjects()
    var ix = this.indexOfSha(sha)
    return this.offsets[ix]
  }
  
  // Return the checksum of the object with the given sha.
  this.getCrc = function(sha) {
    var numObjects = this.numObjects()
    var crcArrayOffset = 8 + 256*4 + numObjects*20
    var ix = this.indexOfSha(sha)
    var offset = crcArrayOffset + ix*4
    return this.bytesToInteger(this.data.slice(offset, offset + 4))
  }
  
  // Does this pack index contain 64b offsets?
  this.has64bOffsets = function() {
    var numObjects = this.numObjects()
    var expectedLength = 8 + 256*4 + numObjects*20 + numObjects*4 + numObjects*4 + 40
    return this.data.length > expectedLength + 7 // 64b offsets are 8 bytes
  }
  
  // Returns the index offset into the sha array which is the first occurrence
  // of shas with first byte matching the first byte of the given sha.
  this.fanout = function(sha) {
    var firstByte = parseInt(sha.slice(0, 2), 16) - 1
    if (firstByte === -1) {
      return 0
    } else {
      var fanoutBytes = this.data.slice(8 + firstByte*4, 8 + firstByte*4 + 4)
      return this.bytesToInteger(fanoutBytes)
    }
  }
  
  // Returns the index of this sha into the three arrays: sha[], crc[] and offset[]
  this.indexOfSha = function(sha) {
    var ix = this.fanout(sha)
    var currentSha = this.shaAtIndex(ix)
    var firstByte = sha.slice(0, 2)
    while (currentSha !== sha) {
      ix++
      currentSha = this.shaAtIndex(ix)
      if (ix >= this.numObjects()) {
        return null
      } else {
        if (currentSha.slice(0, 2) !== firstByte) {
          return null
        }
      }
    }
    return ix 
  }
  
  // Returns the sha at the given index into the sha array
  this.shaAtIndex = function(ix) {
    var shaArrayOffset = 8 + 256*4
    var offset = shaArrayOffset + ix*20
    return this.bytesToSha(this.data.slice(offset, offset + 20))
  }
  
  // Extracts the offset array from the data, and gets the maximum offset
  // Return {offsets: [int], max: int}
  this.offsetInfo = function() {
    var offsets = []
    var numObjects = this.numObjects()
    var offsetArrayOffset = 8 + 256*4 + numObjects*20 + numObjects*4
    var i
    var max = 0
    for (i = 0; i < numObjects; i++) {
      var offsetBytes = this.data.slice(offsetArrayOffset + i*4, offsetArrayOffset + i*4 + 4)
      var offset = this.bytesToInteger(offsetBytes)
      if (offset > max) { max = offset}
      offsets.push(offset)
    }
    return {offsets: offsets, max: max}
  }
  
  // Returns an estimate (a lower bound) of the size of the packfile. 
  this.estimatedPackFileSize = function() {
    return this.maxOffset
  }
  
  var info = this.offsetInfo()
  this.offsets = info.offsets
  this.maxOffset = info.max
}

Git.PackIndex.assertVersion = function(binary, expectedVersion) {
  var versionBytes = binary.slice(4, 8)
  return _(versionBytes).isEqual([0, 0, 0, expectedVersion])
}
