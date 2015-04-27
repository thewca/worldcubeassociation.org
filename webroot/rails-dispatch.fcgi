#!/home/cubing/ruby/bin/ruby
ENV['RAILS_ENV'] = 'production'
# TODO - production mode needs a *secret* SECRET_KEY_BASE, so we should
# regenerate this and move it out of git sometime =).
ENV['SECRET_KEY_BASE'] = '618b9b31adafca97047f798f1d180f8bf1b79147134aaf146bf3e2b49dd60a619c687daa767db48e7443c72ba804d4b46cccad0a1f84dd1b8ef685dd0c596f06'

# On the WCA server, we compiled our own, latest version of ruby, and set
# gems to be installed to /home/cubing/.gems.
if File.directory?('/home/cubing/.gems')
  ENV['HOME'] ||= "/home/cubing/"
  ENV['GEM_HOME'] = File.expand_path('~/.gems')
  ENV['GEM_PATH'] = File.expand_path('~/.gems')
end
require 'fcgi'

require File.join(File.dirname(__FILE__), '../WcaOnRails/config/environment.rb')
class Rack::PathInfoRewriter
  def initialize(app)
    @app = app
  end
  def call(env)
    env.delete('SCRIPT_NAME')
    parts = env['REQUEST_URI'].split('?')
    env['PATH_INFO'] = parts[0]
    env['QUERY_STRING'] = parts[1].to_s
    @app.call(env)
  end
end
Rack::Handler::FastCGI.run Rack::PathInfoRewriter.new(WcaOnRails::Application)
