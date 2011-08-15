var BinaryFile = require('../binary_file')
  , utils = require('./utils')
  , Pack = require('./pack')

// A parser for the response to /git-upload-pack, which contains some
// progress information and a pack file. Delegates parsing the packfile to
// the packFileParser.
//
// Has methods parse, getRemoteLines and getObjects.
var UploadPackParser = function(binary) {
  var binaryString = utils.toBinaryString(binary)
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
    length = parseInt(utils.bytesToString(peek(4)), 16);

    if(isNaN(length) || length === 0) return null;
    advance(4);
    if (length == 0) {
      return null;
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

  this.parse = function(ready) {
    console.log("Parsing upload pack of  " + binaryString.length + " bytes")
    var startTime = new Date()
    var pktLine = nextPktLine()
    var packFileParser
    var remoteLine = ""
    var packData = ""
    var gotAckOrNak = false

    while (utils.bytesToString(pktLine).slice(0, 7) === "shallow") {
      pktLine = nextPktLine()
    }
    while (utils.bytesToString(pktLine) === "NAK\n" ||
            utils.bytesToString(pktLine).slice(0, 3) === "ACK") {
      pktLine = nextPktLine()
      gotAckOrNak = true
    }

    if (!gotAckOrNak) {
      ready(new Error("got neither ACK nor NAK in upload pack response"))
    }

    while (pktLine !== null) {
      // sideband format. "2" indicates progress messages, "1" pack data
      if (pktLine[0] == 2) {
        var lineString = utils.bytesToString(pktLine)
        lineString = lineString.slice(1, lineString.length)
        remoteLine += lineString
      }
      else if (pktLine[0] == 1) {
        packData += utils.bytesToString(pktLine.slice(1))
      }
      else if (pktLine[0] == 3) {
        ready(new Error("fatal error in packet line"))
      }
      pktLine = nextPktLine()
    }

    packFileParser = new Pack(packData)
    packFileParser.parseAll(function(err, data) {
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
      ready(null, packFileParser) 
    })
  };
}

module.exports = exports = UploadPackParser
