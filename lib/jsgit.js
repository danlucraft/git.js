
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
    
  toBinaryString: function(binary) {
    if (Array.isArray(binary)) {
      return JsGit.bytesToString(binary)
    }
    else {
      return binary
    }
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