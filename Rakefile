


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
  load_file = File.read(File.dirname(__FILE__) + "/lib/git-client.js")
  paths = load_file.scan(/getScript\("\/([^"]*)"\)/)
  js = ["jsGitInNode = false"]
  paths.each do |path|
    js << File.read(File.dirname(__FILE__) + "/" + path.first)
  end
  total_js = js.join("\n\n")
  File.open("lib/git.min.js", "w") {|f| f.puts total_js }
  puts "packaged lib/git.min.js"
end

desc "Run the demo repo-viewer webapp off a local git http instance"
task :demo => :package_client do
  exec("thin -R demos/config.ru -p 9292 start")
end