
JsGit.applyDelta = (function() {
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
  
  return function(baseData, delta) {
    var stream = {data: delta, offset: 0}
    
    var baseLength = matchLength(stream)
    if (baseLength != baseData.length) {
      throw (Error("Delta Error: base length not equal to length of given base data"))
    }
    
    var resultLength = matchLength(stream)
    
    var resultData = ""
    
    var opcode = stream.data[stream.offset]
    stream.offset += 1
    var copyOffset = 0
    var copyLength = 0
    if ((opcode & 0x80) == 0) {
      resultData += stream.data.slice(stream.offset, stream.offset + opcode)
      stream.offset += opcode
    }
    else {
      var value
      var shift = 0
      _(4).times(function() {
        if ((opcode & 0x01) != 0) {
          value = stream.data[stream.offset]
          stream.offset += 1
          copyOffset += (value << shift)
        }
        opcode >>= 1
        shift += 8
      })
      shift = 0
      _(2).times(function() {
        if ((opcode & 0x01) != 0) {
          value = stream.data[stream.offset]
          stream.offset += 1
          copyLength += (value << shift)
        }
        opcode >>= 1
        shift += 8
      })
      if (copyLength == 0) {
        copyLength = (1<<16)
      }
      resultData += baseData.slice(copyOffset, copyOffset + copyLength)
    }
    
    if (resultLength != resultData.length) {
      throw (Error("Delta Error: result length not as expected"))
    }

    return resultData
  }
}())

