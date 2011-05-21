#!/usr/bin/env node

require('../lib/git-server')

// Get rid of process runner ('node' in most cases)
var arg, args = [], argv = process.argv.slice(2);

var cli = new Git.Cli(argv)
cli.run()

