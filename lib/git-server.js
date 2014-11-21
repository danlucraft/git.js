var path = require('path')

window = global
jsGitInNode = true

_ = require('../vendor/underscore-min')
require('../vendor/js-deflate/rawdeflate')
require('../vendor/js-deflate/rawinflate')
require('../vendor/sha1')
require('../vendor/md5')
require('../vendor/diff')
require('./string_helpers')
require('./binary_file')
require('./git/upload_pack_parser')
require('./git/pack')
require('./git/remote')
require('./git/http_remote')
require('./git/smart_http_remote')
require('./git/objects')
require('./git/file-diff')
require('./git/tree-diff')
require('./git/delta')
require('./git/pack_index')
require('./git/cli')
require('./git/memory_repo')

// Only for server
require('./git/repo')
require('./git/command-runner')
require('./git/commands/show-command')
require('./git/commands/branch-command')
require('./git/commands/log-command')
require('./git/commands/diff-command')
require('./git/pack-file')

var Git = require('./git')
module.exports = exports = new Git
