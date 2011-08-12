var btoa = this.btoa || require('./btoa');

// these are created (dynamically!) via
// a <script type="text/vbscript"> insertion.
var IEBinary_getLength = this.IEBinary_getLength
 ,  IEBinary_getByteAt = this.IEBinary_getByteAt;

BinaryFile = function(strData, iDataOffset, iDataLength) {
	this.data = strData;
	this.dataOffset = iDataOffset || 0;
	this.dataLength = 0;
  
  if (typeof strData == "string") {
		this.dataLength = iDataLength || this.data.length;
		this.getByteAt = this.getByteAt_CharCode;
	} else if (typeof strData == "unknown") {
		this.dataLength = iDataLength || IEBinary_getLength(this.data);
    this.getByteAt = this.getByteAt_IEBinary;
  } else {
    throw new Error(
      "BinaryFile was given a " + (typeof strData) + " and doesn't know what to do with it"
    );
  }
};

BinaryFile.prototype.getByteAt_CharCode = function(iOffset) {
  return this.data.charCodeAt(iOffset + this.dataOffset) & 0xFF;
};

BinaryFile.prototype.getByteAt_IEBinary = function(iOffset) {
  return IEBinary_getByteAt(this.data, iOffset + this.dataOffset);
};

BinaryFile.prototype.getRawData = function() {
  return this.data;
}

BinaryFile.prototype.slice = function(begin, optionalEnd) {
  var arr = [];
  var end = optionalEnd || this.getLength();
  var i;
  for (i = begin; i < end; i++) {
    arr.push(this.getByteAt(i));
  }
  return arr;
}

BinaryFile.prototype.getLength = function() {
  return this.dataLength;
}

BinaryFile.prototype.getSByteAt = function(iOffset) {
  var iByte = this.getByteAt(iOffset);
  if (iByte > 127)
    return iByte - 256;
  else
    return iByte;
}

BinaryFile.prototype.getShortAt = function(iOffset, bBigEndian) {
  var iShort = bBigEndian ? 
    (this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
    : (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
  if (iShort < 0) iShort += 65536;
  return iShort;
}

BinaryFile.prototype.getSShortAt = function(iOffset, bBigEndian) {
  var iUShort = this.getShortAt(iOffset, bBigEndian);
  if (iUShort > 32767)
    return iUShort - 65536;
  else
    return iUShort;
}

BinaryFile.prototype.getLongAt = function(iOffset, bBigEndian) {
  var iByte1 = this.getByteAt(iOffset),
    iByte2 = this.getByteAt(iOffset + 1),
    iByte3 = this.getByteAt(iOffset + 2),
    iByte4 = this.getByteAt(iOffset + 3);

  var iLong = bBigEndian ? 
    (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
    : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
  if (iLong < 0) iLong += 4294967296;
  return iLong;
}

BinaryFile.prototype.getSLongAt = function(iOffset, bBigEndian) {
  var iULong = this.getLongAt(iOffset, bBigEndian);
  if (iULong > 2147483647)
    return iULong - 4294967296;
  else
    return iULong;
}

BinaryFile.prototype.getStringAt = function(iOffset, iLength) {
  var aStr = [];
  for (var i=iOffset,j=0;i<iOffset+iLength;i++,j++) {
    aStr[j] = String.fromCharCode(this.getByteAt(i));
  }
  return aStr.join("");
}

BinaryFile.prototype.getCharAt = function(iOffset) {
  return String.fromCharCode(this.getByteAt(iOffset));
}

BinaryFile.prototype.toBase64 = function() {
  return btoa(this.data);
}

BinaryFile.prototype.fromBase64 = function(strBase64) {
  data = window.atob(strBase64);
}

module.exports = exports = BinaryFile;
