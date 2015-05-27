if node.chef_environment == "production"
  include_recipe 'tarsnap'
  username, repo_root = WcaHelper.get_username_and_repo_root(self)
  tarsnap_backup 'secrets' do
    path "#{repo_root}/secrets"
    schedule 'weekly'
  end
end
