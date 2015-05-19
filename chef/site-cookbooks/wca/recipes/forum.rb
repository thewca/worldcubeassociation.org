secrets = data_bag_item("secrets", "all")
username, repo_root = UsernameHelper.get_username_and_repo_root(node)

template "#{repo_root}/webroot/forum/config.php" do
  source "forum_config.php.erb"
  variables({
    secrets: secrets,
  })
end
