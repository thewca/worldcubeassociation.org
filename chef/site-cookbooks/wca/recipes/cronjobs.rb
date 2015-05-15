username, repo_root = UsernameHelper.get_username_and_repo_root(node)

cron "db backup" do
  minute '*/5'
  hour '*'
  weekday '*'
  month '*'

  mailto "jeremyfleischman@gmail.com"
  command "#{repo_root}/scripts/db.sh dump /secrets/worldcubeassociation.org_alldbs.tar.gz"
end
