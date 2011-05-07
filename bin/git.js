#!/usr/bin/env node

require('../lib/jsgit-server')

// Get rid of process runner ('node' in most cases)
var arg, args = [], argv = process.argv.slice(2);

var cli = new JsGit.Cli(argv)
cli.run()

