
// A parser for the response to /git-upload-pack, which contains some
// progress information and a pack file. Delegates parsing the packfile to 
// the packFileParser.
// 
// Has methods parse, getRemoteLines and getObjects.
Git.UploadPackParser = function(binary) {
  var binaryString = Git.toBinaryString(binary)
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
    length = parseInt(Git.bytesToString(peek(4)), 16);
    advance(4);
    if (length == 0) {
    //   return nextPktLine()
    } else {
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
    console.log("Parsing upload pack of  " + binaryString.length + " bytes")
    var startTime = new Date()
    var pktLine = nextPktLine()
    var packFileParser
    var remoteLine = ""
    var packData = ""
    var gotAckOrNak = false
    
    while (Git.bytesToString(pktLine).slice(0, 7) === "shallow") {
      pktLine = nextPktLine()
    }
    while (Git.bytesToString(pktLine) === "NAK\n" || 
            Git.bytesToString(pktLine).slice(0, 3) === "ACK") {
      pktLine = nextPktLine()
      gotAckOrNak = true
    }
    
    if (!gotAckOrNak) {
      throw(Error("got neither ACK nor NAK in upload pack response"))
    }
    
    while (pktLine !== null) {
      // sideband format. "2" indicates progress messages, "1" pack data
      if (pktLine[0] == 2) {
        var lineString = Git.bytesToString(pktLine)
        lineString = lineString.slice(1, lineString.length)
        remoteLine += lineString
      }
      else if (pktLine[0] == 1) {
        packData += Git.bytesToString(pktLine.slice(1))
      }
      else if (pktLine[0] == 3) {
        throw(Error("fatal error in packet line"))
      }
      pktLine = nextPktLine()
    }
    
    packFileParser = new Git.Pack(packData)
    packFileParser.parseAll()
    objects = packFileParser.getObjects()
          
    remoteLines = []
    var newLineLines = remoteLine.split("\n")
    for (var i = 0; i < newLineLines.length; i++) {
      var crLines = newLineLines[i].split("\r")
      var newRemoteLine = crLines[crLines.length - 1]
      if (newRemoteLine !== "") {
        remoteLines.push(newRemoteLine)
      }
    }
    console.log("took " + (new Date().getTime() - startTime.getTime()) + "ms")
  };
}

