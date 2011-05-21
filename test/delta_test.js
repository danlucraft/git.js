require('../lib/git-server')

DeltaTestData = {
  withCopyHunk: {
    baseData: 'Test Repo1\n==========\n\nJust a test repo for something I\'m working on\n\nThis branch (branch1) has a new file and a modified file!\n',
    delta: [128, 1, 69, 144, 69],
    expectedResult: 'Test Repo1\n==========\n\nJust a test repo for something I\'m working on\n'
  },
  withManyHunks: {
    baseData: "require 'rubygems'\nrequire 'rake'\n\nbegin\n  require 'jeweler'\n  Jeweler::Tasks.new do |gem|\n    gem.name = \"mega_mutex\"\n    gem.summary = %Q{Cross-process mutex using MemCache}\n    gem.description = %Q{Cross-process mutex using MemCache}\n    gem.email = \"developers@songkick.com\"\n    gem.homepage = \"http://github.com/songkick/mega_mutex\"\n    gem.authors = [\"Matt Johnson\", \"Matt Wynne\"]\n    gem.add_dependency 'memcache-client', '>= 1.7.4'\n    gem.add_dependency 'logging', '>= 1.1.4'\n    # gem is a Gem::Specification... see http://www.rubygems.org/read/chapter/20 for additional settings\n  end\n  Jeweler::GemcutterTasks.new\nrescue LoadError\n  puts \"Jeweler (or a dependency) not available. Install it with: sudo gem install jeweler\"\nend\n\nnamespace :github do\n  task :push do\n    remotes = `git remote`.split(\"\\n\")\n    unless remotes.include?('github')\n      sh('git remote add github git@github.com:songkick/mega_mutex.git')\n    end\n    sh('git push github master')\n  end\nend\n\nrequire 'spec/rake/spectask'\nSpec::Rake::SpecTask.new(:spec) do |spec|\n  spec.libs << 'lib' << 'spec'\n  spec.spec_files = FileList['spec/**/*_spec.rb']\nend\n\nSpec::Rake::SpecTask.new(:rcov) do |spec|\n  spec.libs << 'lib' << 'spec'\n  spec.pattern = 'spec/**/*_spec.rb'\n  spec.rcov = true\nend\n\ntask :spec => :check_dependencies\n\ntask :default => [:spec, 'github:push', 'gemcutter:release']\n\nrequire 'rake/rdoctask'\nRake::RDocTask.new do |rdoc|\n  if File.exist?('VERSION')\n    version = File.read('VERSION')\n  else\n    version = \"\"\n  end\n\n  rdoc.rdoc_dir = 'rdoc'\n  rdoc.title = \"mega_mutex \#{version}\"\n  rdoc.rdoc_files.include('README*')\n  rdoc.rdoc_files.include('lib/**/*.rb')\nend\n",
    delta: [252,12,236,12,144,140,26,68,105,115,116,114,105,98,117,116,101,100,32,109,117,116,101,120,32,102,111,114,32,82,117,98,121,145,174,27,26,68,105,115,116,114,105,98,117,116,101,100,32,109,117,116,101,120,32,102,111,114,32,82,117,98,121,177,235,145,5],
    expectedResult: 'require \'rubygems\'\nrequire \'rake\'\n\nbegin\n  require \'jeweler\'\n  Jeweler::Tasks.new do |gem|\n    gem.name = "mega_mutex"\n    gem.summary = %Q{Distributed mutex for Ruby}\n    gem.description = %Q{Distributed mutex for Ruby}\n    gem.email = "developers@songkick.com"\n    gem.homepage = "http://github.com/songkick/mega_mutex"\n    gem.authors = ["Matt Johnson", "Matt Wynne"]\n    gem.add_dependency \'memcache-client\', \'>= 1.7.4\'\n    gem.add_dependency \'logging\', \'>= 1.1.4\'\n    # gem is a Gem::Specification... see http://www.rubygems.org/read/chapter/20 for additional settings\n  end\n  Jeweler::GemcutterTasks.new\nrescue LoadError\n  puts "Jeweler (or a dependency) not available. Install it with: sudo gem install jeweler"\nend\n\nnamespace :github do\n  task :push do\n    remotes = `git remote`.split("\\n")\n    unless remotes.include?(\'github\')\n      sh(\'git remote add github git@github.com:songkick/mega_mutex.git\')\n    end\n    sh(\'git push github master\')\n  end\nend\n\nrequire \'spec/rake/spectask\'\nSpec::Rake::SpecTask.new(:spec) do |spec|\n  spec.libs << \'lib\' << \'spec\'\n  spec.spec_files = FileList[\'spec/**/*_spec.rb\']\nend\n\nSpec::Rake::SpecTask.new(:rcov) do |spec|\n  spec.libs << \'lib\' << \'spec\'\n  spec.pattern = \'spec/**/*_spec.rb\'\n  spec.rcov = true\nend\n\ntask :spec => :check_dependencies\n\ntask :default => [:spec, \'github:push\', \'gemcutter:release\']\n\nrequire \'rake/rdoctask\'\nRake::RDocTask.new do |rdoc|\n  if File.exist?(\'VERSION\')\n    version = File.read(\'VERSION\')\n  else\n    version = ""\n  end\n\n  rdoc.rdoc_dir = \'rdoc\'\n  rdoc.title = "mega_mutex #{version}"\n  rdoc.rdoc_files.include(\'README*\')\n  rdoc.rdoc_files.include(\'lib/**/*.rb\')\nend\n'
  }
}

exports['Apply Delta'] = {
  "Delta with copy hunk": function(test) {
    test.equals(
      Git.applyDelta(DeltaTestData.withCopyHunk.baseData, DeltaTestData.withCopyHunk.delta),
      DeltaTestData.withCopyHunk.expectedResult
    )
    test.done()
  },
  
  "Delta with many hunks": function(test) {
    test.equals(
        Git.applyDelta(DeltaTestData.withManyHunks.baseData, DeltaTestData.withManyHunks.delta),
        DeltaTestData.withManyHunks.expectedResult)
    test.done()
  }
}