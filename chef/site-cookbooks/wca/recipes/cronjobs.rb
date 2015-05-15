username, repo_root = UsernameHelper.get_username_and_repo_root(node)

admin_email = "admin@worldcubeassociation.org"

init_php_commands = []
init_php_commands << "#{repo_root}/scripts/db.sh dump /secrets/worldcubeassociation.org_alldbs.tar.gz"
if node.chef_environment != "dev"
  cron "db backup" do
    minute '0'
    hour '0'
    weekday '1'

    mailto admin_email
    user username
    command init_php_commands.last
  end
end

init_php_commands << "#{repo_root}/scripts/cronned_results_scripts.sh"
if node.chef_environment != "dev"
  cron "cronned results scripts" do
    minute '0'
    hour '4'
    weekday '1,3,5'

    mailto admin_email
    user username
    command init_php_commands.last
  end
end

init_php_commands << "(cd #{repo_root}/webroot/results/misc/missing_averages; time php update7205.php)"
if node.chef_environment != "dev"
  cron "Update Missing Averages" do
    minute '0'
    hour '0'
    weekday '*'

    mailto admin_email
    user username
    command init_php_commands.last
  end
end

init_php_commands << "(cd #{repo_root}/webroot/results/misc/evolution; time php update7205.php)"
if node.chef_environment != "dev"
  cron "Update Evolution of Records" do
    minute '0'
    hour '0'
    weekday '*'

    mailto admin_email
    user username
    command init_php_commands.last
  end
end

init_php_commands << "(cd #{repo_root}/webroot/results/admin/; time SERVER_NAME=wca REQUEST_URI='doit=live' php compute_auxiliary_data.php;)"

# Run init-php-results on our first provisioning, but not on subsequent provisions.
lockfile = '/tmp/php-results-initialized'
init_php_commands.each do |cmd|
  bash cmd do
    code cmd
    user username
    not_if { ::File.exists?(lockfile) }
  end
end

file lockfile do
  action :create_if_missing
end
