module WcaHelper
  # gregorbg: This method exists as a relic from a time when we needed to distinguish between "real" servers and Vagrant.
  # Now that we're planning to get rid of Chef entirely, I didn't bother to properly refactor this.
  def self.get_username_and_repo_root(recipe)
    username = "cubing"
    repo_root = "/home/#{username}/worldcubeassociation.org"

    return [ username, repo_root ]
  end

  def self.get_secrets(recipe)
    if recipe.node.chef_environment == "development"
      recipe.data_bag_item("secrets", "development")
    elsif recipe.node.chef_environment == "staging"
      recipe.data_bag_item("secrets", "staging")
    elsif recipe.node.chef_environment == "production"
      recipe.data_bag_item("secrets", "production")
    else
      raise "Unrecognized chef_environment: #{recipe.node.chef_environment}"
    end
  end
end
