var MemoryRepo = require('./memory_repo')

// Helper for creating Repos for a Github proxy
module.exports = function(username, reponame, password) {
  var repo = new MemoryRepo()
  var githubCredentials = "password=" + encodeURI(password) + "&username=" + username
  var remoteUrl = "http://localhost:3000/" + username + "/" + reponame + ".git?server=" + encodeURI("https://github.com") + "&" + githubCredentials
  repo.addRemote("origin", remoteUrl)
  return repo
}
