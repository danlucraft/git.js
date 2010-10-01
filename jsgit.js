
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
  
  parseDiscovery: function(data) {
    var lines = data.split("\n");
    var result = {"refs":{}};
    for ( i = 1; i < lines.length - 1; i++) {
      thisLine = lines[i];
      if (i == 1) {
        var bits = thisLine.split("\0");
        result["capabilities"] = bits[1];
        var bits2 = bits[0].split(" ");
        result["refs"][bits2[1]] = bits2[0].substring(8);
      }
      else {
        var bits2 = thisLine.split(" ");
        result["refs"][bits2[1]] = bits2[0].substring(4);
      }
    }
    return result;
  },
  
  discovery: function(user, repo) {
    $.get(
      'http://localhost:3000/github/' + user + "/" + repo + '.git/info/refs?service=git-upload-pack',
      "",
      function(data) {
        $('#response').html(data);
        parseDiscovery(data);
      }
    );
  },
  
  demo: function() {
    this.discovery("danlucraft", "clojure-dojo");
  }
}