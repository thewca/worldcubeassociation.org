username, repo_root = WcaHelper.get_username_and_repo_root(self)

admin_email = "admin@worldcubeassociation.org"
path = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games"

db_dump_folder = "#{repo_root}/secrets/wca_db"
dump_command = "#{repo_root}/scripts/db.sh dump #{db_dump_folder}"
if node.chef_environment != "development"
  cron "db backup" do
    minute '0'
    hour '0'
    weekday '1'

    path path
    mailto admin_email
    user username
    if node.chef_environment == "production"
      command "#{dump_command} && #{repo_root}/scripts/backup.sh"
    else
      command dump_command
    end
  end
end

init_php_commands = []
init_php_commands << "#{repo_root}/scripts/cronned_results_scripts.sh"
if node.chef_environment != "development"
  cron "cronned results scripts" do
    minute '0'
    hour '4'
    weekday '1,3,5'

    path path
    mailto admin_email
    user username
    command init_php_commands.last
  end
end

init_php_commands << "(cd #{repo_root}/webroot/results/admin/; time SERVER_NAME=wca REQUEST_URI='doit=live' php compute_auxiliary_data.php)"

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
