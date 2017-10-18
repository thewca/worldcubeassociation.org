# frozen_string_literal: true

# https://github.com/colszowka/simplecov#want-to-use-spring-with-simplecov
if ENV['RAILS_ENV'] == 'test'
  require 'simplecov'
  SimpleCov.start
end

%w(
  .ruby-version
  .rbenv-vars
  tmp/restart.txt
  tmp/caching-dev.txt
).each { |path| Spring.watch(path) }
