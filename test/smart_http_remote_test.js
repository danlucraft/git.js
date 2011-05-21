
require('../lib/git-server')

SMART_HTTP_REMOTE_TEST_DATA = {
  discovery: {
    data: "001e# service=git-upload-pack\n0000009bb3453be87b70a0c5dea28aacd49cf34ddb91a8c5 HEAD\000multi_ack thin-pack side-band side-band-64k ofs-delta shallow no-progress include-tag multi_ack_detailed\n003fb3453be87b70a0c5dea28aacd49cf34ddb91a8c5 refs/heads/master\n0000",
    result:{
    "capabilities":"multi_ack thin-pack side-band side-band-64k ofs-delta shallow no-progress include-tag multi_ack_detailed",
    "refs":[
        {"name":"HEAD", "sha":"b3453be87b70a0c5dea28aacd49cf34ddb91a8c5"},
        {"name":"refs/heads/master", "sha":"b3453be87b70a0c5dea28aacd49cf34ddb91a8c5"}
      ]
    }
  }
}

exports.SmartHttpRemoteTest = {
  parseDiscovery: function(test) {
    test.deepEqual(
      Git.SmartHttpRemote.parseDiscovery(SMART_HTTP_REMOTE_TEST_DATA.discovery.data), 
      SMART_HTTP_REMOTE_TEST_DATA.discovery.result, 
      "Decodes the capabilities and refs from the discovery response.")
    test.done()
  }
}