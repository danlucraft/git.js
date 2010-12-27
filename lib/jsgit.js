
JsGit = {
  
  bytesToString: function(bytes) {
    var result = "";
    var i;
    for (i = 0; i < bytes.length; i++) {
      result = result.concat(String.fromCharCode(bytes[i]));
    }
    return result;
  },
  
  stringToBytes: function(string) {
    var bytes = []; 
    var i; 
    for(i = 0; i < string.length; i++) {
      bytes.push(string.charCodeAt(i));
    }
    return bytes;
  },
    
  // A parser for the response to /git-upload-pack, which contains some
  // progress information and a pack file. Delegates parsing the packfile to 
  // the packFileParser.
  // 
  // Has methods parse, getRemoteLines and getObjects.
  UploadPackParser: function(binary) {
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
      var pktLine = nextPktLine();
      var safe = 0;
      var packFileParser;
      
      remoteLine = "";
      if (JsGit.bytesToString(pktLine) === "NAK\n") {
        pktLine = nextPktLine();
        while (pktLine !== null && safe < 10) {
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
          safe += 1;
        }
      }
      else {
        throw(Error("couldn't match NAK"));
      }
      
      remoteLines = []
      var newLineLines = remoteLine.split("\n")
      for (var i = 0; i < newLineLines.length; i++) {
        var crLines = newLineLines[i].split("\r")
        var newRemoteLine = crLines[crLines.length - 1]
        if (newRemoteLine !== "")
          remoteLines.push(newRemoteLine);
      }
    };
  },

  toBinaryString: function(binary) {
    if (Array.isArray(binary)) {
      return JsGit.bytesToString(binary)
    }
    else {
      return binary
    }
  },
  
  // A parser for a pack file. Pack files are used for more than just
  // in the HTTP protocol.
  //
  // Has methods parse and getObjects, where getObjects returns a list of 
  // {sha:"...", data:"..."} objects.
  PackFileParser: function(binary) {
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
  },
  
  makePost: function(username, repo, password, ref) {
    $.ajax({
      url: 'http://localhost:3000/github/' + username + ":" + password + "/" + repo + '.git/git-upload-pack',
      data: "0067want " + ref + " multi_ack_detailed side-band-64k thin-pack ofs-delta\n00000009done\n",
      type: "POST",
      contentType: "application/x-git-upload-pack-request",
      success: function(data, textStatus, xhr) {
        var binaryData = xhr.responseText;
        //$('#response2').html(binaryData);
        var parser = new JsGit.UploadPackParser(binaryData);
        parser.parse();
        var i;
        for(i = 0; i < parser.getRemoteLines().length; i++ ) {
          $('#response2').append("<br />" + parser.getRemoteLines()[i]);
        }
        var objects = parser.getObjects();
        for (i = 0; i < objects.length; i++) {
          $("#objects").append("<li>" + objects[i].sha + "<br /><pre>" + objects[i].data + "</pre></li>")
        }
      },
      error: function(xhr, data, e) {
        $('#response2').append(xhr.status).
        append("<br />").
        append(xhr.responseText);
      },
      beforeSend: function(xhr) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
      }
    });
  },

  // returns the next pkt-line
  nextPktLine: function(data) {
    var length = parseInt(data.substring(0, 4), 16);
    return data.substring(4, length);
  },
  
  // Parses the response to /info/refs?service=git-upload-pack, which contains ids for
  // refs/heads and a capability listing for this git HTTP server.
  //
  // Returns {capabilities:"...", refs: [{name:"...", sha:"..."}, ...]}
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
  
  discovery: function(username, repo, password) {
    $.get(
      'http://localhost:3000/github/' + username + ":" + password + "/" + repo + '.git/info/refs?service=git-upload-pack',
      "",
      function(data) {
        var discInfo = JsGit.parseDiscovery(data);
        var i, ref;
        for (i = 0; i < discInfo.refs.length; i++) {
          ref = discInfo.refs[i];
          $("#refs").append("<li>" + ref["name"] + ":" + ref["sha"] + "</li>");
        }
        $('#response').html(data);
        JsGit.makePost(username, repo, password, discInfo.refs[0].sha)
      }
    );
  },
  
  demo: function(username, repo, password) {
    this.discovery(username, repo, encodeURI(password));
  }
}