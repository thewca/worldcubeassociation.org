source 'https://rubygems.org'

gem 'foodcritic'
gem 'rake'
gem 'chef'
gem 'chefspec'

group :integration do
  # The integration tools are easier to run with berkshelf and strainer.
  # However, these gems conflict with chef and should be installed into the
  # environment with the gem command and not added to the application gem
  # bundle.
  #
  # gem install berkshelf strainer

  gem 'test-kitchen', '1.0.0.beta.2'
  gem 'kitchen-docker', git: 'https://github.com/portertech/kitchen-docker.git'
end
