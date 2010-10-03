
JsGit = {
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