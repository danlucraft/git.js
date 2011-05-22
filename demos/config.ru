require 'fileutils'

require File.expand_path(File.dirname(__FILE__) + "/../vendor/grack")

def setup_demo_repo
  serve_dir = File.expand_path(File.dirname(__FILE__) + "/serve/git.js")
  FileUtils.mkdir_p(serve_dir)
  
  repo_dir   = File.expand_path(File.dirname(__FILE__) + "/../.git")
  target_dir = File.expand_path(serve_dir)
  FileUtils.cp_r(repo_dir + "/.", target_dir)
end

class ServeGitJs
  def initialize(app) @app = app; end
  
  def call(env)
    if env["PATH_INFO"] == "/git.min.js"
      path = File.expand_path(File.dirname(__FILE__) + "/../lib/git.min.js")
      if File.exist?(path)
        content = File.read(path)
        status  = 200
      else
        content = "git.min.js doesn't exist"
        status  = 404
      end
      [status, {"Content-Type" => "application/javascript"}, content]
    else
      @app.call(env)
    end
  end
end

serve_path = File.expand_path(File.dirname(__FILE__) + "/serve")
GRACK_CONFIG = {
  :project_root => serve_path,
  :git_path     => '/usr/local/bin/git',
  :upload_pack  => true,
  :receive_pack => true,
}

use Rack::Static, :urls => ["/repo-viewer"], :root => "demos/"
use Rack::Static, :urls => ["/vendor"]
use ServeGitJs
run GitHttp::App.new(GRACK_CONFIG)

setup_demo_repo
puts "serving git repos from #{serve_path} at http://localhost:9292"