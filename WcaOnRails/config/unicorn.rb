dir = File.expand_path(File.dirname(__FILE__) + "/..")
working_directory dir

listen 3000
listen "/tmp/unicorn.wca.sock"

pid "#{dir}/pids/unicorn.pid"

stderr_path "#{dir}/log/unicorn.log"
stdout_path "#{dir}/log/unicorn.log"

require 'system'
worker_processes (System::CPU.count * 1.5).ceil

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
