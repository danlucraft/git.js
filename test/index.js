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

var trace = require('tracejs').trace;
var assert = require('assert');
var errors = [];

var tests = Object.keys(exp).map(function(key) {
    return Object.keys(this[key]).map(function(test) {
      return [key + ' / '+ test, this[test].bind(this, assert)];
    }, this[key]);
}, exp).reduce(function(lhs, rhs) {
  return lhs.concat(rhs);
}, []);

var total = tests.length;
var start = Date.now();

var finish = function() {
  process.stderr.write('\n');
  var last = null;
  errors.forEach(function(error) {
    var name  = error[0]
      , err   = error[1];

    if(last !== name) {
      console.error(' in '+name+':');
      last = name;
    }

    var stack = trace(err);
    process.stderr.write('\t'+err+'\n');
    stack.frames.forEach(function(frame) {
      if(frame) {
        process.stderr.write(frame.filename.replace(process.cwd(), '.')+' on line '+frame.line+' \n')
        process.stderr.write(frame.get_lines(1,1).replace(/\n/g, '\t\n')+'\n')
      }
    });
  });

  process.stderr.write('\n('+(total-errors.length)+' / '+total+') in '+(Date.now() - start)+'ms\n');
  return process.exit(errors.length)
};

var recurse = function() {
  if(!tests.length)
    return finish();
  else {
    var next = tests.shift()
      , name = next[0]
      , test = next[1];
    try {
      test()
    } catch(err) {
      process.stderr.write('F')
      errors.push([name, err])
      recurse()
    }
  }
};

assert.equals = assert.equal
assert.done = function() {
  process.stderr.write('.');
  recurse();
};

return recurse()
