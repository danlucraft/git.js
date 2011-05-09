var path = require('path')

require.paths.unshift(__dirname)

window = global
jsGitInNode = true

_ = require('../vendor/underscore-min')
require('../vendor/js-deflate/rawdeflate')
require('../vendor/js-deflate/rawinflate')
require('../vendor/sha1')
require('../vendor/sha2')
require('../vendor/md5')
require('../vendor/diff')
require('string_helpers')
require('binary_file')
require('jsgit')
require('jsgit/upload_pack_parser')
require('jsgit/pack_file')
require('jsgit/repo')
require('jsgit/remote')
require('jsgit/http_remote')
require('jsgit/smart_http_remote')
require('jsgit/objects')
require('jsgit/diff')
require('jsgit/delta')
require('jsgit/pack_index')
require('jsgit/cli')

// Only for server
require('jsgit/local_remote')
