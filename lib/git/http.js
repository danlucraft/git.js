var get;
if(typeof XMLHttpRequest !== 'undefined') {
  get = function(uri, ready) {
    var xhr = new XMLHttpRequest;
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4) {
        if(xhr.status === 200) {
          ready(null, xhr.responseText)
        } else ready(new Error('Got a '+xhr.status+' response from '+uri));
      }
    }
    xhr.open(
        'GET'
      , uri
      , true
    )
    xhr.send(null) 
  }
} else {
  var http = require('http')
    , url  = require('url')

  get = function(uri, ready) {
    var parsed = url.parse(uri)
    http.request({
        host  : parsed.hostname
      , port  : parseInt(parsed.port || 80)
      , path  : parsed.pathname + parsed.query + parsed.hash
    }, ready)
  }
}

exports.get = get;
