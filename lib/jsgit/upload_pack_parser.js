
// A parser for the response to /git-upload-pack, which contains some
// progress information and a pack file. Delegates parsing the packfile to 
// the packFileParser.
// 
// Has methods parse, getRemoteLines and getObjects.
JsGit.UploadPackParser = function(binary) {
  var binaryString = JsGit.toBinaryString(binary)
  var data   = new BinaryFile(binaryString);
  var offset = 0;
  var remoteLines = null;
  var objects = null;
  
  var peek = function(length) {
    return data.slice(offset, offset + length);
  };
  
  var advance = function(length) {
    offset += length;
  };
  
  // A pkt-line is defined in http://git-scm.com/gitserver.txt
  var nextPktLine = function() {
    var pktLine = null;
    var length;
    length = parseInt(JsGit.bytesToString(peek(4)), 16);
    advance(4);
    if (length != 0) {
      pktLine = peek(length - 4);
      advance(length - 4);
    }
    return pktLine;
  };
  
  this.getRemoteLines = function() {
    return remoteLines;
  };
  
  this.getObjects = function() {
    return objects;
  };
  
  this.parse = function() {
    var pktLine = nextPktLine()
    var packFileParser
    var remoteLine = ""
    var gotAckOrNak = false
    while (JsGit.bytesToString(pktLine) === "NAK\n" || JsGit.bytesToString(pktLine).slice(0, 3) === "ACK") {
      pktLine = nextPktLine()
      gotAckOrNak = true
    }
    
    if (!gotAckOrNak) {
      throw(Error("got neither ACK nor NAK in upload pack response"))
    }
    
    while (pktLine !== null) {
      if (pktLine[0] == 2) {
        var lineString = JsGit.bytesToString(pktLine)
        lineString = lineString.slice(1, lineString.length)
        remoteLine += lineString
      }
      else if (pktLine[0] == 1) {
        if (pktLine.slice(1, 5).compare(JsGit.stringToBytes("PACK"))) {
          packFileParser = new JsGit.PackFileParser(JsGit.bytesToString(pktLine.slice(1)));
          packFileParser.parse();
          objects = packFileParser.getObjects();
        }
      }
      pktLine = nextPktLine();
    }
    
    remoteLines = []
    var newLineLines = remoteLine.split("\n")
    for (var i = 0; i < newLineLines.length; i++) {
      var crLines = newLineLines[i].split("\r")
      var newRemoteLine = crLines[crLines.length - 1]
      if (newRemoteLine !== "") {
        remoteLines.push(newRemoteLine);
      }
    }
  };
}

