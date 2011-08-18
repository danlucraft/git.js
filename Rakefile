
namespace :test do
  desc "Reset the github test repo"
  task :reset do
    github_url = "https://danlucraft:#{File.read("githubpw").chomp}@github.com/danlucraft/clojure-dojo.git"
    orig_commit = "b60971573593e660dcef1e43a63a01890bfc667a"
    sh "git clone #{GITHUB_URL} test-repo"
    cd "test-repo" do
      sh("git reset #{ORIG_COMMIT} --hard")
      sh("git push -f origin master")
    end
    rm_rf "test-repo"
  end
end

desc "Concatenate the javascript for the client"
task :package_client do
  preamble = <<-PREAMBLE
    (function(exp) {
        exp.Git = {}
        exp.Git.modules = {}
        var getModule = function(path) {
            var module = exp.Git.modules[path]
            if(module)
                return module
            module = {
                exports:{},
                path:path,
                execute:null,
                toString:function() { return '<Module: "'+path+'">'; }
            }
            exp.Git.modules[path] = module
            return module
        }

        var resolve = function(path) {
            var bits = path.split('/')
            var out = []
            for(var i = 0, len = bits.length; i < len; ++i) {
                var cur = bits[i]
                if(bits[i] === '.')
                    continue;
                else if(bits[i] === '..')
                    out.pop()
                else
                    out.push(bits[i])
            }
            return out.join('/')
        }

        var getRequire = function(module) {
            var basename = module.path.split('/').slice(0, -1).join('/');
            return function(path) {
                path === 'underscore' &&
                  (path = 'vendor/underscore-min')

                var first = path.slice(0, 2),
                    fullpath
                if(first === './' || first === '..') {
                    fullpath = resolve(basename+'/'+path)
                } else {
                    fullpath = resolve(path)
                }
                var mod = exp.Git.modules[fullpath]
                mod.execute && mod.execute()
                return mod.exports
            }
        }

        exp.GIT__module__ = getModule
        exp.GIT__require__ = getRequire
        exp.Git.require = getRequire(getModule('.'))
    })(window);
  PREAMBLE

  wrap = <<-WRAP
    (function() {
        var module = GIT__module__('%s')
        var require = GIT__require__(module)
        module.execute = function() {
            (function(module, exports, require) {
                %s
            })(this, this.exports, require)
            module.execute = null; 
        }
    })();
  WRAP

  # TODO: replace this hackiness with something better.
  libraries = Dir['lib/*.js'] + Dir['lib/*/*.js'] + Dir['lib/*/*/*.js']
  vendor = Dir['vendor/*.js'] + Dir['vendor/*/*.js']

  js = [preamble]
  (libraries + vendor).each do |path|
    js << wrap % [ 
        path.sub('.js', ''),
        File.read(File.dirname(__FILE__) + "/" + path)
    ] 
  end 

  total_js = js.join("\n\n")
  FileUtils.mkdir_p("build")
  File.open("build/git.min.js", "w") {|f| f.puts total_js }
  puts "packaged build/git.min.js"
end

desc "Run the demo repo-viewer webapp off a local git http instance"
task :demo => :package_client do
  exec("thin -R demos/config.ru -p 9292 start")
end
