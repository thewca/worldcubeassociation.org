# frozen_string_literal: true

dir = File.expand_path(File.dirname(__FILE__) + "/..")
working_directory dir

allowed_environments = {
  'development' => true,
  'staging' => true,
  'production' => true,
}
rack_env = ENV.fetch('RACK_ENV', nil)
if !allowed_environments[rack_env]
  raise "Unrecognized RACK_ENV: #{rack_env}, must be one of #{allowed_environments.keys.join ', '}"
end
if rack_env == "development"
  worker_processes 1
else
  stderr_path "#{dir}/log/unicorn-#{rack_env}.log"
  stdout_path "#{dir}/log/unicorn-#{rack_env}.log"

  worker_processes((Etc.nprocessors * 2).ceil)
end

listen 3000
pid "#{dir}/pids/unicorn.pid"

timeout 60

preload_app true

before_fork do |_server, _worker|
  if defined?(ActiveRecord::Base)
    ActiveRecord::Base.connection.disconnect!
  end
end

after_fork do |_server, _worker|
  if defined?(ActiveRecord::Base)
    ActiveRecord::Base.establish_connection
  end
end
