username, repo_root = WcaHelper.get_username_and_repo_root(self)

template "/home/#{username}/supervisor-worker.sh" do
  source "supervisor-worker.sh.erb"
  mode 0755
  variables({
    repo_root: repo_root,
    username: username,
  })
end

package 'supervisor'

template "/etc/supervisor/conf.d/workers.conf" do
  source "workers.conf.erb"
  variables({
    repo_root: repo_root,
    username: username,
  })
end
