
test('parseDiscovery()', function() {
  var data = "001e# service=git-upload-pack\n0000009bb60971573593e660dcef1e43a63a01890bfc667a HEAD\000multi_ack thin-pack side-band side-band-64k ofs-delta shallow no-progress include-tag multi_ack_detailed\n003fb60971573593e660dcef1e43a63a01890bfc667a refs/heads/master\n0000";

  same(JsGit.parseDiscovery(data), {
    "capabilities":"multi_ack thin-pack side-band side-band-64k ofs-delta shallow no-progress include-tag multi_ack_detailed",
    "refs":{
      "HEAD":"b60971573593e660dcef1e43a63a01890bfc667a",
      "refs/heads/master":"b60971573593e660dcef1e43a63a01890bfc667a"
    }
    }, "Decodes the capabilities and refs from the discovery response.");
});