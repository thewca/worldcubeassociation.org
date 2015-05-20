module WcaHelper
  def self.get_username_and_repo_root(recipe)
    vagrant_user = recipe.node['etc']['passwd']['vagrant']
    if vagrant_user
      username = "vagrant"
      repo_root = "/vagrant"
    else
      username = "cubing"
      repo_root = "/home/#{username}/worldcubeassociation.org"
    end
    return [ username, repo_root ]
  end

  def self.get_secrets(recipe)
    if recipe.node.chef_environment == "development"
      recipe.data_bag_item("secrets", "development")
    else
      # Note that we use production secrets in staging mode.
      recipe.data_bag_item("secrets", "production")
    end
  end
end
