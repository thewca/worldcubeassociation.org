username, repo_root = UsernameHelper.get_username_and_repo_root(node)

admin_email = "admin@worldcubeassociation.org"

# For some reason, "php -B ... -F ..." tries to read from stdin, so we close stdin.
execute "(cd #{repo_root}/webroot/results/admin/; time SERVER_NAME=wca REQUEST_URI='doit=live' php compute_auxiliary_data.php;)" do
  user username
end

cmd = "#{repo_root}/scripts/db.sh dump /secrets/worldcubeassociation.org_alldbs.tar.gz"
execute cmd do
  user username
end
cron "db backup" do
  minute '0'
  hour '0'
  weekday '1'

  mailto admin_email
  user username
  command cmd
end

cmd = "#{repo_root}/scripts/cronned_results_scripts.sh"
execute cmd do
  user username
end
cron "cronned results scripts" do
  minute '0'
  hour '4'
  weekday '1,3,5'

  mailto admin_email
  user username
  command cmd
end

cmd = "(cd #{repo_root}/webroot/results/misc/missing_averages; time php update7205.php)"
execute cmd do
  user username
end
cron "Update Missing Averages" do
  minute '0'
  hour '0'
  weekday '*'

  mailto admin_email
  user username
  command cmd
end

cmd = "(cd #{repo_root}/webroot/results/misc/evolution; time php update7205.php)"
execute cmd do
  user username
end
cron "Update Evolution of Records" do
  minute '0'
  hour '0'
  weekday '*'

  mailto admin_email
  user username
  command cmd
end
