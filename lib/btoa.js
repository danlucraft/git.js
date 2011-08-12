var Buffer = require('buffer').Buffer
module.exports = function(str) {
  return (new Buffer(str, 'utf8')).toString('base64')
}
