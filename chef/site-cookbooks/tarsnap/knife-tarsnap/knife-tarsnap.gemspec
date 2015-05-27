# -*- encoding: utf-8 -*-
require File.expand_path('../lib/knife-tarsnap/version', __FILE__)

Gem::Specification.new do |gem|
  gem.name          = "knife-tarsnap"
  gem.version       = Knife::Tarsnap::VERSION
  gem.authors       = ["Scott Sanders"]
  gem.email         = ["scott@jssjr.com"]
  gem.description   = %q{Knife plugin and Chef cookbook for managing tarsnap.}
  gem.summary       = %q{Provides a chef cookbook with LWRP's to directory snapshots and maintain retention schedules. Includes a knife plugin for managing tarsnap keys, listing backups, and restoring files.}
  gem.homepage      = "https://github.com/jssjr/chef-tarsnap"
  gem.licenses      = ["APACHE"]

  gem.files         = Dir['lib/**/*.rb'] + Dir['bin/*']
  gem.files        += Dir['[A-Z]*'] + Dir['test/**/*']
  gem.files        += Dir['*\.gemspec']
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})

  gem.add_dependency "chef", ">= 0.10.10"

  gem.require_paths = ["lib"]
end
