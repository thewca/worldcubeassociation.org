secrets = WcaHelper.get_secrets(self)
username, repo_root = WcaHelper.get_username_and_repo_root(self)

template "#{repo_root}/webroot/forum/config.php" do
  source "forum_config.php.erb"
  variables({
    secrets: secrets,
  })
end
