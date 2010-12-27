
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
    
  makePost: function(repo, ref) {
    var url = repo.getRemotes()["origin"].url + '/git-upload-pack'
    $.ajax({
      url: url,
      data: "0067want " + ref + " multi_ack_detailed side-band-64k thin-pack ofs-delta\n00000009done\n",
      type: "POST",
      contentType: "application/x-git-upload-pack-request",
      success: function(data, textStatus, xhr) {
        var binaryData = xhr.responseText;
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
  
  demo: function(username, reponame, password) {
    try {
      var repo = new JsGit.GithubProxyRepo(username, reponame, password)
      repo.getRemotes()["origin"].fetchRefs(function(refs) {
        var i, ref
        for (i = 0; i < refs.length; i++) {
          ref = refs[i]
          $("#refs").append("<li>" + ref["name"] + ":" + ref["sha"] + "</li>")
        }
        JsGit.makePost(repo, refs[0].sha)
      })
    } catch (e) {
      console.log(e)
    }
  }
}