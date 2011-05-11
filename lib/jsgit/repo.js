
JsGit.Repo = function(dir) {
  var that = {}
  
  that.getLooseObject = function(sha) {
    
  }
  
  that.getObject = function(sha) {
    var obj = that.getLooseObject(sha)
    if (obj) {
      return obj
    } else {
      eachPackFile(function(packFile) {
        var obj = packFile.getObject(sha)
        if (obj) {
          return obj
        }
      })
    }
    return null
  }
}