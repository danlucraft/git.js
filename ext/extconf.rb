# Loads mkmf which is used to make makefiles for Ruby extensions
require 'mkmf'

# Give it a name
extension_name = 'myzlib'

# The destination
dir_config(extension_name)
if have_library("z", "inflate")
  p :found
  # Do the work
  create_makefile(extension_name)
end