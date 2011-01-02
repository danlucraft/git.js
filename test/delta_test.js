require('../lib/jsgit-server')

DeltaTestData = {
  withCopyHunk: {
    baseData: 'Test Repo1\n==========\n\nJust a test repo for something I\'m working on\n\nThis branch (branch1) has a new file and a modified file!\n',
    delta: [128, 1, 69, 144, 69]
  }
}

exports['Apply Delta'] = {
  "Delta with copy hunk": function(test) {
    test.equals(JsGit.applyDelta(DeltaTestData.withCopyHunk.baseData, DeltaTestData.withCopyHunk.delta),
      'Test Repo1\n==========\n\nJust a test repo for something I\'m working on\n')
    test.done()
  }
}