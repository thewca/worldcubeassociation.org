#!/usr/bin/env ruby
ENV['RAILS_ENV'] = 'development'

# On the WCA server, we compiled our own, latest version of ruby, and set
# gems to be installed to /home/cubing/.gems.
if File.directory?('/home/cubing/.gems')
  ENV['HOME'] ||= "/home/cubing/.gems"
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
Rack::Handler::FastCGI.run  Rack::PathInfoRewriter.new(WcaOnRails::Application) 
