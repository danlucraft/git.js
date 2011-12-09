var utils = require('./utils')
var _ = require('underscore')

module.exports = (function() {
  var matchLength = function(stream) {
    var data = stream.data
    var offset = stream.offset
    var result = 0
    var currentShift = 0
    var _byte = 128
    var maskedByte, shiftedByte
    
    while ((_byte & 128) != 0) {
      _byte = data[offset]
      offset += 1
      maskedByte = _byte & 0x7f
      shiftedByte = maskedByte << currentShift
      result += shiftedByte
      currentShift += 7
    }
    stream.offset = offset
    return result
  }
  
  return function(baseDataString, delta) {
    var baseData = utils.stringToBytes(baseDataString)
    var stream = {data: delta, offset: 0, length: delta.length}
    
    var baseLength = matchLength(stream)
    if (baseLength != baseData.length) {
      throw new Error("Delta Error: base length not equal to length of given base data")
    }
    
    var resultLength = matchLength(stream)
    var resultData = ""
    
    var copyOffset
    var copyLength
    var opcode
    var copyFromResult
    while (stream.offset < stream.length) {
      opcode = stream.data[stream.offset]
      stream.offset += 1
      copyOffset = 0
      copyLength = 0
      if (opcode == 0) {
        throw(Error("Don't know what to do with a delta opcode 0"))
      } else if ((opcode & 0x80) != 0) {
        var value
        var shift = 0

        for(var x = 0; x < 4; ++x) {
          if ((opcode & 0x01) != 0) {
            value = stream.data[stream.offset]
            stream.offset += 1
            copyOffset += (value << shift)
          }
          opcode >>= 1
          shift += 8
        }
        shift = 0
        for(var x = 0; x < 2; ++x) {
          if ((opcode & 0x01) != 0) {
            value = stream.data[stream.offset]
            stream.offset += 1
            copyLength += (value << shift)
          }
          opcode >>= 1
          shift += 8
        }
        if (copyLength == 0) {
          copyLength = (1<<16)
        }
        
        // TODO: check if this is a version 2 packfile and apply copyFromResult if so
        copyFromResult = (opcode & 0x01)
        resultData += utils.bytesToString(baseData.slice(copyOffset, copyOffset + copyLength))
        
      } else if ((opcode & 0x80) == 0) {
        resultData += utils.bytesToString(stream.data.slice(stream.offset, stream.offset + opcode))
        stream.offset += opcode
      }
    }
    
    if (resultLength != resultData.length) {
      throw new Error("Delta Error: got result length " + resultData.length + ", expected " + resultLength)
    }
    return resultData
  }
}())

