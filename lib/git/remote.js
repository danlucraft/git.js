var _ = require('underscore')

var queryParams = function(uri) {
  var paramString = uri.split("?")[1]
  if (!paramString) {
    return {}
  }
  
  var paramStrings = paramString.split("&")
  var params = {}
  _(paramStrings).each(function(paramString) {
    var pair = paramString.split("=")
    params[pair[0]] = decodeURI(pair[1])
  })
  return params
}

var Remote = function(repo, name, repoUrl) {
  this.repo = repo
  this.name = name
  this.refs = {}
  this.url = repoUrl.replace(/\?.*/, "").replace(/\/$/, "")
  this.urlOptions = queryParams(repoUrl)
};

Remote.prototype.makeUri = function(path, extraOptions) {
  var uri = this.url + path
  var options = _(this.urlOptions).extend(extraOptions || {})
  if (options && _(options).size() > 0) {
    var optionKeys = _(options).keys()
    var optionPairs = _(optionKeys).map(function(optionName) {
      return optionName + "=" + encodeURI(options[optionName])
    })

    return uri + "?" + optionPairs.join("&")
  }
  else {
    return uri
  }
}

// Add a ref to this remote. fullName is of the form:
//   refs/heads/master or refs/tags/123
Remote.prototype.addRef = function(fullName, sha) {
  var type, name
  if (fullName.slice(0, 5) == "refs/") {
    type = fullName.split("/")[1]
    name = this.name + "/" + fullName.split("/")[2]
  }
  else {
    type = "HEAD"
    name = this.name + "/" + "HEAD"
  }
  this.refs[name] = {name:name, sha:sha, remote:this, type:type}
}

Remote.prototype.getRefs = function() {
  return _(this.refs).values()
}

Remote.prototype.getRef = function(name) {
  return this.refs[this.name + "/" + name]
}

module.exports = exports = Remote
