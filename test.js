
function makePost() {
  $.ajax({
    url: 'http://localhost:3000/github/danlucraft/clojure-dojo.git/git-upload-pack',
    data: "0067want b60971573593e660dcef1e43a63a01890bfc667a multi_ack_detailed side-band-64k thin-pack ofs-delta\n00000009done\n",
    type: "POST",
    contentType: "application/x-git-upload-pack-request",
    success: function(data) {
      $('#response2').html(data);
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader("Accept", "application/x-git-upload-pack-result");
      xhr.setRequestHeader("User-Agent", "git/1.7.1.1");
    },
    error: function(xhr, data, e) {
      $('#response2').append(xhr.status).
      append("<br />").
      append(xhr.responseText);
    }
    
  });
}

function attempt() {
  $.get(
    'http://localhost:3000/github/danlucraft/clojure-dojo.git/info/refs?service=git-upload-pack',
    "",
    function(data) {
      $('#response').html(data);
      makePost();
    }
  );
}
attempt();