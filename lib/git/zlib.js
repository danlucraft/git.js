var inflate = require('../../vendor/js-deflate/rawinflate')
  , deflate = require('../../vendor/js-deflate/rawdeflate')

var BB = this.BlobBuilder || this.WebKitBlobBuilder || this.MozBlobBuilder
  , Worker = this.Worker
  , URL = this.URL || this.webkitURL || this.mozURL;

if(BB && Worker && URL && false) {  // TODO: re-enable if necessary.
  var workerize = function(src) {
    var blobBuilder = new BB()
      , blob
      , url
      , str = ''

    blobBuilder.append('var module = {};(');
    blobBuilder.append(src);
    blobBuilder.append(')();('+function() {
      onmessage = function(ev) {
        postMessage(module.exports(ev.data, true));
      };    
    }+')();')


    blob = blobBuilder.getBlob('text/javascript')
    url = URL.createObjectURL(blob)

    return function(uncompressed, ready) {
      var worker = new Worker(url)

      worker.addEventListener('message', function(ev) {
        ready(null, ev.data[0], ev.data[1])
      }, false);

      worker.addEventListener('error', function(err) {
        ready(err);
      }, false);

      worker.postMessage(uncompressed);
    };
  };

  exports.deflate = workerize(deflate.source)
  exports.inflate = workerize(inflate.source)
} else {
  exports.inflate = function(data, offset, ready) {
    data = inflate.zip_inflate(data, offset)
    ready(null, data[0], data[1])
  };
  exports.inflate_array_of_uint8 = function(data, offset, ready) {
    data = inflate.zip_inflate_array_of_uint8(data, offset)
    ready(null, data[0], data[1])
  };

  exports.deflate = function(data, ready) {
    ready(null, deflate(data))
  } 
}
