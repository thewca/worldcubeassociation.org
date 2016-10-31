username, repo_root = WcaHelper.get_username_and_repo_root(self)

package 'supervisor'

template "/etc/supervisor/conf.d/workers.conf" do
  source "workers.conf.erb"
  variables({
    repo_root: repo_root,
  })
  notifies :run, 'execute[supervisor-update]', :delayed
end

execute "supervisor-update" do
  command "supervisorctl update"
  action :nothing
end
