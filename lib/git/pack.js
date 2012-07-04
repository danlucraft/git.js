var BinaryFile = require('../binary_file')
  , utils = require('./utils')
  , Sha1 = require('../../vendor/sha1')
  , inflate = require('../../vendor/js-deflate/rawinflate')
  , applyDelta = require('./delta')
  , Objects = require('./objects')
  , _ = require('underscore')

// Defined in RFC 1950
var adler32 = function(string) {
  var s1 = 1,
      s2 = 0,
      i;
  var bytes = utils.stringToBytes(string)
  for(i = 0; i < bytes.length; i++) {
    s1 = s1 + bytes[i]
    s2 = s2 + s1
    s1 = s1 % 65521
    s2 = s2 % 65521
  }
  return s2*65536 + s1
}

var objectHash = function(type, content) {
  var data = type + " " + content.length + "\0" + content
  // return new SHA1(data).hexdigest()
  return Sha1.rstr2hex(Sha1.rstr_sha1(data))
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

// Encapsulates a pack file, with methods to extract objects:
//
//  getObjectAtOffset(offset)
//
// Also the entire file can be parsed, but this can take quite
// some time for all but the smallest pack files.
//
//  parseAll()

var Pack = function(binary) {
  this.binaryString = utils.toBinaryString(binary)
  this.data = new BinaryFile(this.binaryString)
  this.offset = 0
  this.objects = null
}

Pack.prototype.peek = function(length) {
  return this.data.slice(this.offset, this.offset + length)
}

Pack.prototype.rest = function() {
  return this.data.slice(this.offset)
}

Pack.prototype.advance = function(length) {
  this.offset += length
}

Pack.prototype.matchPrefix = function() {
  if (utils.bytesToString(this.peek(4)) === "PACK") {
    this.advance(4)
  }
  else {
    throw new Error("couldn't match PACK")
  }
}

Pack.prototype.matchVersion = function(expectedVersion) {
  var actualVersion = this.peek(4)[3]
  this.advance(4)
  if (actualVersion !== expectedVersion) {
    throw new Error("expected packfile version " + expectedVersion + ", but got " + actualVersion)
  }
}

Pack.prototype.matchNumberOfObjects = function() {
  var num = 0
  _(this.peek(4)).each(function(b) {
    num = num << 8
    num += b
  })
  this.advance(4);
  return num;
}

Pack.prototype.objectSizeInfosToSize = function(sizeInfos) {
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

Pack.prototype.getType = function(typeStr) {
  return {
    "001":"commit",
    "010":"tree",
    "011":"blob",
    "100":"tag",
    "110":"ofs_delta",
    "111":"ref_delta"
    }[typeStr]
}

Pack.prototype.matchObjectHeader = function() {
  var sizeInfos       = []
  var hintTypeAndSize = this.peek(1)[0].toString(2).rjust(8, "0")
  var typeStr         = hintTypeAndSize.slice(1, 4)
  var needMore        = (hintTypeAndSize[0] == "1")
  var hintAndSize     = null
  var objectStartOffset = this.offset

  sizeInfos.push(hintTypeAndSize.slice(4, 8))
  this.advance(1)

  while (needMore) {
    hintAndSize = this.peek(1)[0].toString(2).rjust(8, "0")
    needMore    = (hintAndSize[0] == "1")
    sizeInfos.push(hintAndSize.slice(1))
    this.advance(1)
  }
  return {size:this.objectSizeInfosToSize(sizeInfos), type:this.getType(typeStr), offset: objectStartOffset}
}

Pack.prototype.matchBytes = function(bytes) {
  var i
  var nextByte
  for (i = 0; i < bytes.length; i++) {
    nextByte = this.peek(1)[0]
    if (nextByte !== bytes[i]) {
      throw new Error("adler32 checksum didn't match")
    }
    this.advance(1)
  }
}

// XXX: Possibly unused?
Pack.prototype.advanceToBytes = function(bytes) {
  var nextByte
  var matchedByteCount = 0
  while (matchedByteCount < bytes.length) {
    nextByte = peek(1)[0]
    if (nextByte == bytes[matchedByteCount]) {
      matchedByteCount++
    } else {
      matchedByteCount = 0
    }
    this.advance(1)
  }
}

Pack.prototype.matchOffsetDeltaObject = function(header) {
  var offsetBytes       = []
  var hintAndOffsetBits = this.peek(1)[0].toString(2).rjust(8, "0")
  var needMore          = (hintAndOffsetBits[0] == "1")

  offsetBytes.push(hintAndOffsetBits.slice(1, 8))
  this.advance(1)

  while (needMore) {
    hintAndOffsetBits = this.peek(1)[0].toString(2).rjust(8, "0")
    needMore          = (hintAndOffsetBits[0] == "1")
    offsetBytes.push(hintAndOffsetBits.slice(1, 8))
    this.advance(1)
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

  var deflated = utils.stripZlibHeader(this.rest())
  var uncompressedData = inflate(utils.bytesToString(deflated))
  var checksum = adler32(uncompressedData)
  this.advance(2 + uncompressedData.compressedLength)
  this.matchBytes(intToBytes(checksum, 4))
  return {
    type: header.type,
    sha: null,
    desiredOffset: header.offset - offsetDelta,
    offset: header.offset,
    data: utils.stringToBytes(uncompressedData.toString())
  }
}

Pack.prototype.matchNonDeltaObject = function(header) {
  var deflated = utils.stripZlibHeader(this.rest())
  var uncompressedData = inflate(utils.bytesToString(deflated))
  var checksum = adler32(uncompressedData)
  this.advance(2 + uncompressedData.compressedLength)
  this.matchBytes(intToBytes(checksum, 4))

  return {
    offset: header.offset,
    type: header.type,
    sha: objectHash(header.type, uncompressedData),
    data: uncompressedData.toString()
  }
}

Pack.prototype.matchObjectData = function(header) {
  if (header.type == "ofs_delta") {
    return this.matchOffsetDeltaObject(header)
  }
  else if (header.type == "ref_delta") {
    var shaBytes = peek(20)
    this.advance(20)
    var sha = _(shaBytes).map(function(b) { return b.toString(16).rjust(2, "0")}).join("")
    throw new Error("found ref_delta")
  }
  else {
    return this.matchNonDeltaObject(header)
  }
}

Pack.prototype.matchObjectAtOffset = function(startOffset) {
  this.offset = startOffset
  var header = this.matchObjectHeader()
  return this.matchObjectData(header)
}

Pack.prototype.stripOffsetsFromObjects = function() {
  _(this.objects).each(function(object) {
    delete object.offset
  })
}

Pack.prototype.objectAtOffset = function(offset) {
  return _(this.objects).detect(function(obj) { return obj.offset == offset })
}

Pack.prototype.expandOffsetDeltas = function() {
  var self = this
  _(this.objects).each(function(object) {
    self.expandDelta(object)
  })
}

Pack.prototype.expandDelta = function(object) {
  if (object.type == "ofs_delta") {
    this.expandOffsetDelta(object)
  }
}

Pack.prototype.getObjectAtOffset = function(offset) {
  if (this.objects) {
    return this.objectAtOffset(offset)
  }
  var rawObject = this.matchObjectAtOffset(offset)
  this.expandDelta(rawObject)

  var newObject = Objects.make(rawObject.sha, rawObject.type, rawObject.data)
  return newObject
}

Pack.prototype.expandOffsetDelta = function(object) {
  var baseObject = this.getObjectAtOffset(object.desiredOffset)
  if (baseObject.type == "ofs_delta" || baseObject.type == "ref_delta") {
    throw new Error("delta pointing to delta, can't handle this yet")
  }
  else {
    var expandedData = applyDelta(baseObject.data, object.data)
    object.type = baseObject.type
    object.fromDelta = {type: "ofs_delta", data: object.data, base: baseObject.sha}
    delete object.desiredOffset
    object.data = expandedData
    object.sha = objectHash(object.type, object.data)
  }
}

Pack.prototype.parseAll = function() {
  try {
    var numObjects
    var i
    this.objects = []

    this.matchPrefix()
    this.matchVersion(2)
    numObjects = this.matchNumberOfObjects()

    for (i = 0; i < numObjects; i++) {
      var object = this.matchObjectAtOffset(this.offset)
      this.objects.push(object)
    }
    this.expandOffsetDeltas()
    this.stripOffsetsFromObjects()
  }
  catch(e) {
    console.log("Error caught in pack file parsing data")
    throw(e)
  }
  return this
}

Pack.prototype.getObjects = function() {
  return this.objects
}

Pack.prototype.getObjectAtOffset = Pack.prototype.getObjectAtOffset

module.exports = exports = Pack
