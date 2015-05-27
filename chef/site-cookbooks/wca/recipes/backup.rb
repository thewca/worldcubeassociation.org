username, repo_root = WcaHelper.get_username_and_repo_root(self)

if node.chef_environment == "production"
  node.default['tarsnap']['key_path'] = "/etc"
  node.default['tarsnap']['key_file_owner'] = username
  node.default['tarsnap']['key_file_group'] = username
  node.default['tarsnap']['cachedir_file_owner'] = username
  include_recipe 'tarsnap'

  lockfile = '/tmp/tarsnap-fsck'
  execute "tarsnap --fsck" do
    not_if { ::File.exists?(lockfile) }
  end
  file lockfile do
    action :create_if_missing
  end
end
