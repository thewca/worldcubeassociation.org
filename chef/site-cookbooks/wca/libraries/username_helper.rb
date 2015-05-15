module UsernameHelper
  def self.get_username_and_repo_root(node)
    vagrant_user = node['etc']['passwd']['vagrant']
    if vagrant_user
      username = "vagrant"
      repo_root = "/vagrant"
    else
      username = "cubing"
      repo_root = "/home/#{username}/worldcubeassociation.org"
    end
    return [ username, repo_root ]
  end
end
