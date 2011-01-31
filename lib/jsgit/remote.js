
JsGit.Remote = function(repo, name, repoUrl) {
  this.repo = repo
  this.name = name
  this.refs = {}
  this.url = repoUrl.replace(/\?.*/, "").replace(/\/$/, "")
  this.urlOptions = JsGit.Remote.queryParams(repoUrl)

  this.makeUri = function(path, extraOptions) {
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

  this.fetchRef = function(wantRef, callback) {
    var url = this.makeUri('/git-upload-pack')
    var body = JsGit.SmartHttpRemote.refWantRequest(wantRef, repo.haveRefs(repo.getAllRefs()))
    var thisRemote = this
    $.ajax({
      url: url,
      data: body,
      type: "POST",
      contentType: "application/x-git-upload-pack-request",
      beforeSend: function(xhr) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined')
      },
      success: function(data, textStatus, xhr) {
        var binaryData = xhr.responseText
        var parser = new JsGit.UploadPackParser(binaryData)
        parser.parse()
        var objectDatas = parser.getObjects()
        if (!objectDatas) {
          throw("Upload pack contained no objects! Data is: " + JsGit.stringToBytes(binaryData).toString())
        }
        var i, object
        var newObjects = []
        for (i = 0; i < objectDatas.length; i++) {
          object = objectDatas[i]
          var newObject = thisRemote.repo.addObject(object.sha, object.type, object.data)
          newObjects.push(newObject)
        }
        if (callback != "undefined") {
          callback(parser.getRemoteLines(), newObjects)
        }
      },
      error: function(xhr, data, e) {
        JsGit.displayError("ERROR Status: " + xhr.status + ", response: " + xhr.responseText)
      }
    });
  }
  
  // Add a ref to this remote. fullName is of the form:
  //   refs/heads/master or refs/tags/123
  this.addRef = function(fullName, sha) {
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
  
  this.getRefs = function() {
    return _(this.refs).values()
  }
  
  this.getRef = function(name) {
    return this.refs[this.name + "/" + name]
  }
}

JsGit.Remote.queryParams = function(uri) {
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




