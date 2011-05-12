require('../lib/jsgit-server')
var path = require('path')

exports['--git-dir'] = {
  "default should be the current working directory": function(test) {
    test.equals(
      new JsGit.Cli().gitDir,
      process.cwd()
    )
    test.done()
  },
  
  "can specify a relative git dir": function(test) {
    test.equals(
      new JsGit.Cli(["--git-dir=.."]).gitDir,
      path.join(process.cwd(), "..")
    )
    test.done()
  },
  
  "can specify an absolute git dir": function(test) {
    var test_dir = path.join(process.cwd(), "..", "..")
    test.equals(
      new JsGit.Cli(["--git-dir=" + test_dir]).gitDir,
      test_dir
    )
    test.done()
  }
}
