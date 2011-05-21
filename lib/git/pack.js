

// Encapsulates a pack file, with methods to extract objects:
//
//  getObjectAtOffset(offset)
//
// Also the entire file can be parsed, but this can take quite
// some time for all but the smallest pack files.
//
//  parseAll()
Git.Pack = function(binary) {
  var binaryString = Git.toBinaryString(binary)
  var data = new BinaryFile(binaryString)
  var offset = 0
  var objects = null
  
  if (typeof require === "undefined") {
    var myDebug = function(obj) { console.log(obj) }
  }
  else {
    var myDebug = require('util').debug
  }
  
  var peek = function(length) {
    return data.slice(offset, offset + length)
  }
  
  var rest = function() {
    return data.slice(offset)
  }
  
  var advance = function(length) {
    offset += length
  }
  
  var matchPrefix = function() {
    if (Git.bytesToString(peek(4)) === "PACK") {
      advance(4)
    }
    else {
      throw(Error("couldn't match PACK"))
    }
  }
  
  var matchVersion = function(expectedVersion) {
    var actualVersion = peek(4)[3]
    advance(4)
    if (actualVersion !== expectedVersion) {
      throw("expected packfile version " + expectedVersion + ", but got " + actualVersion)
    }
  }
  
  var matchNumberOfObjects = function() {
    var num = 0
    _(peek(4)).each(function(b) {
      num = num << 8
      num += b
    })
    advance(4);
    return num;
  }
  
  var objectSizeInfosToSize = function(sizeInfos) {
    var current = 0,
        currentShift = 0,
        i,
        sizeInfo;
        
    for (i = 0; i < sizeInfos.length; i++) {
      sizeInfo = sizeInfos[i]
      current += (parseInt(sizeInfo, 2) << currentShift)
      currentShift += sizeInfo.length
    }
    return current
  }
  
  var getType = function(typeStr) {
    return {
      "001":"commit",
      "010":"tree",
      "011":"blob",
      "100":"tag",
      "110":"ofs_delta",
      "111":"ref_delta"
      }[typeStr]
  }
    
  var matchObjectHeader = function() {
    var sizeInfos       = []
    var hintTypeAndSize = peek(1)[0].toString(2).rjust(8, "0")
    var typeStr         = hintTypeAndSize.slice(1, 4)
    var needMore        = (hintTypeAndSize[0] == "1")
    var hintAndSize     = null
    var objectStartOffset = offset
    
    sizeInfos.push(hintTypeAndSize.slice(4, 8))
    advance(1)

    while (needMore) {
      hintAndSize = peek(1)[0].toString(2).rjust(8, "0")
      needMore    = (hintAndSize[0] == "1")
      sizeInfos.push(hintAndSize.slice(1))
      advance(1)
    }
    return {size:objectSizeInfosToSize(sizeInfos), type:getType(typeStr), offset: objectStartOffset}
  }
  
  // Defined in RFC 1950
  var adler32 = function(string) {
    var s1 = 1,
        s2 = 0,
        i;
    var bytes = Git.stringToBytes(string)
    for(i = 0; i < bytes.length; i++) {
      s1 = s1 + bytes[i]
      s2 = s2 + s1
      s1 = s1 % 65521
      s2 = s2 % 65521
    }
    return s2*65536 + s1
  }
  
  var intToBytes = function(val, atLeast) {
    var bytes = []
    var current = val
    while (current > 0) { 
      bytes.push(current % 256)
      current = Math.floor(current / 256)
    }
    while (atLeast && bytes.length < atLeast) {
      bytes.push(0)
    }
    return bytes.reverse()
  }
  
  var matchBytes = function(bytes) {
    var i
    var nextByte
    for (i = 0; i < bytes.length; i++) {
      nextByte = peek(1)[0]
      if (nextByte !== bytes[i]) {
        throw(Error("adler32 checksum didn't match"))
      }
      advance(1)
    }
  }
  
  var advanceToBytes = function(bytes) {
    var nextByte
    var matchedByteCount = 0
    while (matchedByteCount < bytes.length) {
      nextByte = peek(1)[0]
      if (nextByte == bytes[matchedByteCount]) {
        matchedByteCount++
      } else {
        matchedByteCount = 0
      }
      advance(1)
    }
  }
  
  var objectHash = function(type, content) {
    var data = type + " " + content.length + "\0" + content
    // return new SHA1(data).hexdigest()
    return Sha1.rstr2hex(Sha1.rstr_sha1(data))
  }
  
  var matchOffsetDeltaObject = function(header) {
    var offsetBytes       = []
    var hintAndOffsetBits = peek(1)[0].toString(2).rjust(8, "0")
    var needMore          = (hintAndOffsetBits[0] == "1")
    
    offsetBytes.push(hintAndOffsetBits.slice(1, 8))
    advance(1)

    while (needMore) {
      hintAndOffsetBits = peek(1)[0].toString(2).rjust(8, "0")
      needMore          = (hintAndOffsetBits[0] == "1")
      offsetBytes.push(hintAndOffsetBits.slice(1, 8))
      advance(1)
    }
    
    var longOffsetString = _(offsetBytes).reduce(function(memo, byteString) {
      return memo + byteString
    }, "")
    
    var offsetDelta = parseInt(longOffsetString, 2)
    var n = 1
    _(offsetBytes.length - 1).times(function() {
      offsetDelta += Math.pow(2, 7*n)
      n += 1
    })

    var deflated = Git.stripZlibHeader(rest())
    var uncompressedData = RawDeflate.inflate(Git.bytesToString(deflated))
    var checksum = adler32(uncompressedData)
    advance(2 + uncompressedData.compressedLength)
    matchBytes(intToBytes(checksum, 4))
    return {
      type: header.type,
      sha: null,
      desiredOffset: header.offset - offsetDelta,
      offset: header.offset,
      data: Git.stringToBytes(uncompressedData.toString())
    }
  }
  
  var matchNonDeltaObject = function(header) {
    var deflated = Git.stripZlibHeader(rest())
    var uncompressedData = RawDeflate.inflate(Git.bytesToString(deflated))
    var checksum = adler32(uncompressedData)
    advance(2 + uncompressedData.compressedLength)
    matchBytes(intToBytes(checksum, 4))
    
    return {
      offset: header.offset,
      type: header.type,
      sha: objectHash(header.type, uncompressedData),
      data: uncompressedData.toString()
    }
  }
  
  var matchObjectData = function(header) {
    if (header.type == "ofs_delta") {
      return matchOffsetDeltaObject(header)
    }
    else if (header.type == "ref_delta") {
      var shaBytes = peek(20)
      advance(20)
      var sha = _(shaBytes).map(function(b) { return b.toString(16).rjust(2, "0")}).join("")
      throw(Error("found ref_delta"))
    }
    else {
      return matchNonDeltaObject(header)
    }
  }
  
  var matchObjectAtOffset = function(startOffset) {
    offset = startOffset
    var header = matchObjectHeader()
    return matchObjectData(header)
  }
  
  var stripOffsetsFromObjects = function() {
    _(objects).each(function(object) {
      delete object.offset
    })
  }
  
  var objectAtOffset = function(offset) {
    return _(objects).detect(function(obj) { return obj.offset == offset })
  }
  
  var expandOffsetDeltas = function() {
    _(objects).each(function(object) {
      expandDelta(object)
    })
  }
  
  var expandDelta = function(object) {
    if (object.type == "ofs_delta") {
      expandOffsetDelta(object)
    }
  }
  
  var getObjectAtOffset = function(offset) {
    if (objects) {
      return objectAtOffset(offset)
    }
    var rawObject = matchObjectAtOffset(offset)
    expandDelta(rawObject)
    var newObject = Git.objects.make(rawObject.sha, rawObject.type, rawObject.data)
    return newObject
  }
  
  var expandOffsetDelta = function(object) {
    var baseObject = getObjectAtOffset(object.desiredOffset)
    if (baseObject.type == "ofs_delta" || baseObject.type == "ref_delta") {
      throw(Error("delta pointing to delta, can't handle this yet"))
    }
    else {
      var expandedData = Git.applyDelta(baseObject.data, object.data)
      object.type = baseObject.type
      object.fromDelta = {type: "ofs_delta", data: object.data, base: baseObject.sha}
      delete object.desiredOffset
      object.data = expandedData
      object.sha = objectHash(object.type, object.data)
    }
  }

  this.parseAll = function() {
    try {
      var numObjects
      var i
      objects = []
      
      matchPrefix()
      matchVersion(2)
      numObjects = matchNumberOfObjects()
      
      for (i = 0; i < numObjects; i++) {
        var object = matchObjectAtOffset(offset)
        objects.push(object)
      }
      expandOffsetDeltas()
      stripOffsetsFromObjects()
    }
    catch(e) {
      console.log("Error caught in pack file parsing data") // + Git.stringToBytes(data.getRawData()))
      throw(e)
    }
    return this
  }
  
  this.getObjects = function() {
    return objects
  }
  
  this.getObjectAtOffset = getObjectAtOffset
}
