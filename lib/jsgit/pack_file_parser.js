
// A parser for a pack file. Pack files are used for more than just
// in the HTTP protocol.
//
// Has methods parse and getObjects, where getObjects returns a list of 
// {sha:"...", data:"...", type: "..."} objects.
JsGit.PackFileParser = function(binary) {
  var binaryString = JsGit.toBinaryString(binary)
  var data = new BinaryFile(binaryString);
  var offset = 0;
  var objects = [];
  
  var peek = function(length) {
    return data.slice(offset, offset + length);
  };
  
  var rest = function() {
    return data.slice(offset);
  };
  
  var advance = function(length) {
    offset += length;
  };
  
  var matchPrefix = function() {
    if (JsGit.bytesToString(peek(4)) === "PACK") {
      advance(4);
    }
    else {
      throw(Error("couldn't match PACK"));
    }
  };
  
  var matchVersion = function(expectedVersion) {
    var actualVersion = peek(4)[3];
    advance(4);
    if (actualVersion !== expectedVersion) {
      throw("expected packfile version " + expectedVersion + ", but got " + actualVersion);
    }
  };
  
  var matchNumberOfObjects = function() {
    // TODO: fix this for number of objects > 255
    var num = peek(4)[3];
    advance(4);
    return num;
  };
  
  var objectSizeInfosToSize = function(sizeInfos) {
    var current = 0,
        currentShift = 0,
        i,
        sizeInfo;
        
        for (i = 0; i < sizeInfos.length; i++) {
      sizeInfo = sizeInfos[i];
      current += (parseInt(sizeInfo, 2) << currentShift);
      currentShift += sizeInfo.length;
    }
    return current;
  };
  
  var getType = function(typeStr) {
    return {
      "001":"commit",
      "010":"tree",
      "011":"blob",
      "100":"tag",
      "110":"ofs_delta",
      "111":"ref_delta"
      }[typeStr]
    };
    
    var matchObjectHeader = function() {
    var sizeInfos       = [];
    var hintTypeAndSize = peek(1)[0].toString(2).rjust(8, "0");
    var typeStr         = hintTypeAndSize.slice(1, 4);
    var needMore        = (hintTypeAndSize[0] == "1");
    var hintAndSize     = null;
    
    sizeInfos.push(hintTypeAndSize.slice(4, 8))
    advance(1);

    while (needMore) {
      hintAndSize = peek(1)[0].toString(2).rjust(8, "0");
      needMore    = (hintAndSize[0] == "1");
      sizeInfos.push(hintAndSize.slice(1))
      advance(1);
    }
    return {size:objectSizeInfosToSize(sizeInfos), type:getType(typeStr)}
  };
  
  // zlib files contain a two byte header. (RFC 1950)
  var stripZlibHeader = function(zlib) {
    return zlib.slice(2);
  };
  
  // Defined in RFC 1950
  var adler32 = function(string) {
    var s1 = 1,
        s2 = 0,
        i;
    var bytes = JsGit.stringToBytes(string);
    for(i = 0; i < bytes.length; i++) {
      s1 = s1 + bytes[i];
      s2 = s2 + s1;
      s1 = s1 % 65521;
      s2 = s2 % 65521;
    }
    return s2*65536 + s1;
  };
  
  var intToBytes = function(val) {
    var bytes = []; 
    var current = val; 
    while (current > 0) { 
      bytes.push(current % 256);
      current = Math.floor(current / 256); 
    }
    return bytes.reverse();
  };
  
  var matchBytes = function(bytes) {
    var i;
    var nextByte;
    for (i = 0; i < bytes.length; i++) {
      nextByte = peek(1)[0];
      if (nextByte !== bytes[i]) {
        throw(Error("adler32 checksum didn't match"));
      }
      advance(1);
    }
  };
  
  var objectHash = function(type, content) {
    return Sha1.rstr2hex(Sha1.rstr_sha1(type + " " + content.length + "\0" + content));
  };
  
  var matchObjectData = function(header) {
    var deflated = stripZlibHeader(rest())
    var uncompressedData = RawDeflate.inflate(JsGit.bytesToString(deflated))
    var checksum = adler32(uncompressedData)
    var deflatedData = RawDeflate.deflate(uncompressedData)
    advance(2 + JsGit.stringToBytes(deflatedData).length)
    matchBytes(intToBytes(checksum))
    return {
      type: header.type,
      sha: objectHash(header.type, uncompressedData),
      data: uncompressedData
    }
  }
  
  var matchObject = function() {
    var header = matchObjectHeader();
    return matchObjectData(header);
  };

  this.parse = function() {
    var numObjects;
    var i;
    
    matchPrefix();
    matchVersion(2);
    numObjects = matchNumberOfObjects();
    
    for (i = 0; i < numObjects; i++) {
      objects.push(matchObject());
    }
    return this;
  };
  
  this.getObjects = function() {
    return objects;
  };
}
