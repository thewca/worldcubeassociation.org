# frozen_string_literal: true
# Ported from `system` gem, see
# https://github.com/roja/system/blob/master/lib/system/cpu.rb
#
# Copyright (c) 2009-2012 Roja Buck and Ryan Scott Lewis
def cpu_count
  return Java::Java.lang.Runtime.getRuntime.availableProcessors if RUBY_PLATFORM == "java"
  return File.read('/proc/cpuinfo').scan(/^processor\s*:/).size if File.exist?('/proc/cpuinfo')
  require 'win32ole'
  WIN32OLE.connect("winmgmts://").ExecQuery("select * from Win32_ComputerSystem").NumberOfProcessors
rescue LoadError
  Integer `sysctl -n hw.ncpu 2>/dev/null` rescue 1 # rubocop:disable Style/RescueModifier
end

dir = File.expand_path(File.dirname(__FILE__) + "/..")
working_directory dir

allowed_environments = {
  'development' => true,
  'staging' => true,
  'production' => true,
}
rack_env = ENV['RACK_ENV']
if !allowed_environments[rack_env]
  raise "Unrecognized RACK_ENV: #{rack_env}, must be one of #{allowed_environments.keys.join ', '}"
end
if rack_env == "development"
  listen 3000
  worker_processes 1
else
  stderr_path "#{dir}/log/unicorn-#{rack_env}.log"
  stdout_path "#{dir}/log/unicorn-#{rack_env}.log"

  worker_processes (cpu_count * 1.5).ceil
end

listen "/tmp/unicorn.wca.sock"
pid "#{dir}/pids/unicorn.pid"

timeout 30

preload_app true

before_fork do |server, worker|
  defined?(ActiveRecord::Base) and
    ActiveRecord::Base.connection.disconnect!
end

after_fork do |server, worker|
  defined?(ActiveRecord::Base) and
    ActiveRecord::Base.establish_connection
end
