String.prototype.repeat = function( num ) {
	for( var i = 0, buf = ""; i < num; i++ ) buf += this;
	return buf;
}

String.prototype.ljust = function( width, padding ) {
	padding = padding || " ";
	padding = padding.substr( 0, 1 );
	if( this.length < width )
		return this + padding.repeat( width - this.length );
	else
		return this.toString();
}

String.prototype.rjust = function( width, padding ) {
	padding = padding || " ";
	padding = padding.substr( 0, 1 );
	if( this.length < width )
		return padding.repeat( width - this.length ) + this;
	else
		return this.toString();
}

var BinaryFile = function(strData, iDataOffset, iDataLength) {
	var data = strData;
	var dataOffset = iDataOffset || 0;
	var dataLength = 0;

	this.getRawData = function() {
		return data;
	}
  
  this.slice = function(begin, end) {
    var arr = [];
    var i;
    for (i = begin; i < end; i++) {
      arr.push(this.getByteAt(i));
    }
    return arr;
  }
  
	if (typeof strData == "string") {
		dataLength = iDataLength || data.length;

		this.getByteAt = function(iOffset) {
			return data.charCodeAt(iOffset + dataOffset) & 0xFF;
		}
	} else if (typeof strData == "unknown") {
		dataLength = iDataLength || IEBinary_getLength(data);

		this.getByteAt = function(iOffset) {
			return IEBinary_getByteAt(data, iOffset + dataOffset);
		}
	}

	this.getLength = function() {
		return dataLength;
	}

	this.getSByteAt = function(iOffset) {
		var iByte = this.getByteAt(iOffset);
		if (iByte > 127)
			return iByte - 256;
		else
			return iByte;
	}

	this.getShortAt = function(iOffset, bBigEndian) {
		var iShort = bBigEndian ? 
			(this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
			: (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
		if (iShort < 0) iShort += 65536;
		return iShort;
	}
	this.getSShortAt = function(iOffset, bBigEndian) {
		var iUShort = this.getShortAt(iOffset, bBigEndian);
		if (iUShort > 32767)
			return iUShort - 65536;
		else
			return iUShort;
	}
	this.getLongAt = function(iOffset, bBigEndian) {
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
	this.getSLongAt = function(iOffset, bBigEndian) {
		var iULong = this.getLongAt(iOffset, bBigEndian);
		if (iULong > 2147483647)
			return iULong - 4294967296;
		else
			return iULong;
	}
	this.getStringAt = function(iOffset, iLength) {
		var aStr = [];
		for (var i=iOffset,j=0;i<iOffset+iLength;i++,j++) {
			aStr[j] = String.fromCharCode(this.getByteAt(i));
		}
		return aStr.join("");
	}

	this.getCharAt = function(iOffset) {
		return String.fromCharCode(this.getByteAt(iOffset));
	}
	this.toBase64 = function() {
		return window.btoa(data);
	}
	this.fromBase64 = function(strBase64) {
		data = window.atob(strBase64);
	}
};

JsGit = {
  
  bytesToString: function(bytes) {
    var result = "";
    var i;
    for (i = 0; i < bytes.length; i++) {
      result = result.concat(String.fromCharCode(bytes[i]));
    }
    return result;
  },
    
  uploadPackParserFor: function(binary) {
    var data   = new BinaryFile(binary);
    var offset = 0;
    var remoteLines = null;
    var that = {};
    
    var peek = function(length) {
      return data.slice(offset, offset + length);
    };
    
    var advance = function(length) {
      offset += length;
    };
    
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
    
    that.getRemoteLines = function() {
        return remoteLines;
    };
    
    that.parse = function() {
      var pktLine = nextPktLine();
      var safe = 0;
      var packFileParser;
      
      remoteLines = [];
      if (JsGit.bytesToString(pktLine) === "NAK\n") {
        pktLine = nextPktLine();
        while (pktLine !== null && safe < 10) {
          if (pktLine[0] == 2) {
            remoteLines.push(JsGit.bytesToString(pktLine));
          }
          else if (pktLine[0] == 1) {
            packFileParser = JsGit.packFileParserFor(JsGit.bytesToString(pktLine.slice(1)));
            packFileParser.parse();
          }
          pktLine = nextPktLine();
          safe += 1;
        }
      }
      else {
        throw("couldn't match NAK");
      }
    };
    
    return that;
  },
  
  packFileParserFor: function(binary) {
    var data = new BinaryFile(binary);
    console.log(data.slice(0, 100));
    var offset = 0;
    var objects = [];
    var that = {};
    
    var peek = function(length) {
      return data.slice(offset, offset + length);
    };
    
    var advance = function(length) {
      offset += length;
    };
    
    var matchPrefix = function() {
      if (JsGit.bytesToString(peek(4)) === "PACK") {
        advance(4);
      }
      else {
        throw("couldn't match PACK");
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
    
    var matchObjectHeader = function() {
      var sizeInfos       = [];
      console.log("header: " + peek(1)[0])
      var hintTypeAndSize = peek(1)[0].toString(2);//.rjust(8, "0");
      var typeStr         = hintTypeAndSize.slice(1, 4);
      var needMore        = (hintTypeAndSize[0] == "1");
      sizeInfos.push(hintTypeAndSize.slice(4, 8))
      
      console.log([hintTypeAndSize, typeStr]);
      advance(1);
    }
    
    var matchObject = function() {
      var header = matchObjectHeader();
    };
    
    that.parse = function() {
      var numObjects;
      var i;
      
      matchPrefix();
      matchVersion(2);
      numObjects = matchNumberOfObjects();
      console.log("expecting " + numObjects + " objects");
      
      for (i = 0; i < numObjects; i++) {
        objects.push(matchObject());
      }
    };
    
    that.getObjects = function() {
      return objects;
    };
    
    return that;
  },
  
  // Let's test this function
  isEven: function (val) {
    return val % 2 === 0;
  },
  
  makePost: function () {
    $.ajax({
      url: 'http://localhost:3000/github/danlucraft/clojure-dojo.git/git-upload-pack',
      data: "0067want b60971573593e660dcef1e43a63a01890bfc667a multi_ack_detailed side-band-64k thin-pack ofs-delta\n00000009done\n",
      type: "POST",
      contentType: "application/x-git-upload-pack-request",
      success: function(data) {
        $('#response2').html(data);
        var parser = JsGit.uploadPackParserFor(data);
        parser.parse();
        var i;
        for(i = 0; i < parser.getRemoteLines().length; i++ ) {
          $('#response2').append("<br />" + parser.getRemoteLines()[i]);
        }
      },
      error: function(xhr, data, e) {
        $('#response2').append(xhr.status).
        append("<br />").
        append(xhr.responseText);
      }
    });
  },

  // returns the next pkt-line
  nextPktLine: function(data) {
    var length = parseInt(data.substring(0, 4), 16);
    return data.substring(4, length);
  },
  
  parsePack: function(data) {
    var result = {};
    var server_response = this.nextPktLine(data);
    var nextData        = data.substring(server_response.length + 4)
    var remotes         = this.nextPktLine(nextData);
    result["server_response"] = server_response.substring(0, server_response.length - 1);
    result["remote"]          = remotes;
    //this.parsePackfile(data.substring(server_response.length + 4));
    return result;
  },
  
  parsePackfile: function(data) {
    
  },
  
  parseDiscovery: function(data) {
    var lines = data.split("\n");
    var result = {"refs":[]};
    for ( i = 1; i < lines.length - 1; i++) {
      thisLine = lines[i];
      if (i == 1) {
        var bits = thisLine.split("\0");
        result["capabilities"] = bits[1];
        var bits2 = bits[0].split(" ");
        result["refs"].push({name:bits2[1], sha:bits2[0].substring(8)});
      }
      else {
        var bits2 = thisLine.split(" ");
        result["refs"].push({name:bits2[1], sha:bits2[0].substring(4)});
      }
    }
    return result;
  },
  
  discovery: function(user, repo) {
    $.get(
      'http://localhost:3000/github/' + user + "/" + repo + '.git/info/refs?service=git-upload-pack',
      "",
      function(data) {
        var discInfo = JsGit.parseDiscovery(data);
        var i, ref;
        for (i = 0; i < discInfo["refs"].length; i++) {
          ref = discInfo["refs"][i];
          $("#refs").append("<li>" + ref["name"] + ":" + ref["sha"] + "</li>");
        }
        $('#response').html(data);
        JsGit.makePost()
      }
    );
  },
  
  demo: function() {
    this.discovery("danlucraft", "clojure-dojo");
  }
}