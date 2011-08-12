#!/usr/bin/env node

var Cli = require('../lib/git/cli')

// Get rid of process runner ('node' in most cases)
var arg, args = [], argv = process.argv.slice(2);

var cli = new Cli(argv)
cli.run()

