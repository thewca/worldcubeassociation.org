# frozen_string_literal: true

dir = File.expand_path(File.dirname(__FILE__) + '/..')
working_directory dir

allowed_environments = {
  'development' => true,
  'staging' => true,
  'production' => true,
}
rails_env = ENV.fetch('RAILS_ENV', nil)
unless allowed_environments[rails_env]
  raise "Unrecognized RACK_ENV: #{rails_env}, must be one of #{allowed_environments.keys.join ', '}"
end
if rails_env == 'development'
  puts 'Starting Unicorn in Development'
  worker_processes 1
else
  puts 'Starting Unicorn in production mode'
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
