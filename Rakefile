

GITHUB_URL = "https://danlucraft:#{File.read("githubpw").chomp}@github.com/danlucraft/clojure-dojo.git"
ORIG_COMMIT = "b60971573593e660dcef1e43a63a01890bfc667a"

namespace :test do
  desc "Reset the github test repo"
  task :reset do
    sh "git clone #{GITHUB_URL} test-repo"
    cd "test-repo" do
      sh("git reset #{ORIG_COMMIT} --hard")
      sh("git push -f origin master")
    end
    rm_rf "test-repo"
  end
end