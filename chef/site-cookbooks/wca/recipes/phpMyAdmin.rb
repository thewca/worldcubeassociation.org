secrets = WcaHelper.get_secrets(self)
username, repo_root = WcaHelper.get_username_and_repo_root(self)

template "#{repo_root}/webroot/results/admin/phpMyAdmin/config.inc.php" do
  source "phpMyAdmin_config.inc.php.erb"
  variables({
    secrets: secrets,
  })
end
