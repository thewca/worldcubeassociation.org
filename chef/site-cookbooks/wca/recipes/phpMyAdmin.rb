secrets = data_bag_item("secrets", "all")
username, repo_root = UsernameHelper.get_username_and_repo_root(node)

template "#{repo_root}/webroot/results/admin/phpMyAdmin/config.inc.php" do
  source "phpMyAdmin_config.inc.php.erb"
  variables({
    secrets: secrets,
  })
end
