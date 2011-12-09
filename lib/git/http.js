var HTTP;
if(typeof XMLHttpRequest !== 'undefined') {
  var HTTP = function(method) {
    return function(uri, options, ready, body) {
      typeof options === 'function' ?
        (ready = options, options = {}) :
        null;

      var xhr = new XMLHttpRequest;
      xhr.onreadystatechange = function() {
        if(xhr.readyState === 4) {
          if(xhr.status === 200) {
            ready(null, xhr.responseText)
          } else ready(new Error('Got a '+xhr.status+' response from '+uri));
        }
      }
      xhr.open(
          method
        , uri
        , true
      )

      xhr.overrideMimeType &&
        xhr.overrideMimeType('text/plain; charset=x-user-defined')

      for(var key in options) if(options.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, options[key]);
      }
      xhr.send(body || null) 
    }
  }

} else {
  var http = require('http')
    , url  = require('url')
    , utils= require('./utils')

  HTTP = function(method) {
    return function(uri, headers, ready, body) {
      typeof headers === 'function' ?
        (ready = headers, headers = {}) :
        null;

      var parsed = url.parse(uri)
        , options = {
          host  : parsed.hostname
        , port  : parseInt(parsed.port || 80)
        , path  : parsed.pathname + (parsed.query ? '?'+parsed.query : '') + (parsed.hash || '')
        , method: method
      }
      var req = http.request(options, function(incoming) {
        var chunks = []
        if(incoming.statusCode === 200) {
          incoming.on('data', chunks.push.bind(chunks))
          incoming.on('end',  function() {
            var explicit = chunks.map(function(chunk) {
              return utils.bytesToString(chunk)
            }).reduce(function(lhs, rhs) {
              return lhs + rhs
            }, '')

            ready(null, explicit) 
          })
        } else {
          ready(new Error('Received HTTP Response '+incoming.statusCode))
        }
      })

      Object.keys(headers).forEach(function(key) {
        req.setHeader(key.toLowerCase(), headers[key])
      })
      req.on('error', function(err) {
        ready(err)   
      })
      req.useChunkedEncodingByDefault = false;
      body && req.write(body)
      req.end()
    }
  }
}

exports.get   = HTTP('GET');
exports.post  = HTTP('POST');
