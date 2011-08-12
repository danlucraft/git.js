var exp = {};
var merge = function(what) {
  Object.keys(what).forEach(function(key) {
    exp[key] = what[key]
  })
}
merge(require('./delta_test'))
merge(require('./diff_test'))
merge(require('./http_remote_test'))
merge(require('./jsgit_test'))
merge(require('./memory_repo_test'))
merge(require('./object_test'))
merge(require('./pack_file_test'))
merge(require('./pack_index_test'))
merge(require('./remote_test'))
merge(require('./smart_http_remote_test'))

var assert = require('assert');

var tests = Object.keys(exp).map(function(key) {
    return Object.keys(this[key]).map(function(test) {
      return [key + ' / '+ test, this[test].bind(this, assert)];
    }, this[key]);
}, exp).reduce(function(lhs, rhs) {
  return lhs.concat(rhs);
}, []);


var recurse = function() {
  if(!tests.length)
    return;
  else {
    try {
      tests.shift()[1]()
    } catch(err) {
      process.stderr.write('F');
      recurse()
    }
  }
};

assert.equals = assert.equal
assert.done = function() {
  process.stderr.write('.');
  recurse();
};

recurse()
