dir = File.expand_path(File.dirname(__FILE__) + "/..")
working_directory dir

allowed_environments = {
  'development' => true,
  'staging' => true,
  'production' => true,
}
rack_env = ENV['RACK_ENV']
if !allowed_environments[rack_env]
  throw "Unrecognized RACK_ENV: #{rack_env}, must be one of #{allowed_environments.keys.join ', '}"
end
if rack_env == "development"
  listen 3000
  worker_processes 1
else
  stderr_path "#{dir}/log/unicorn-#{rack_env}.log"
  stdout_path "#{dir}/log/unicorn-#{rack_env}.log"

  require 'system'
  worker_processes (System::CPU.count * 1.5).ceil
end
listen "/tmp/unicorn-#{rack_env}.wca.sock"

pid "#{dir}/pids/unicorn-#{rack_env}.pid"

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
