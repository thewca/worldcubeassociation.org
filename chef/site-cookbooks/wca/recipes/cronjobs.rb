username, repo_root = WcaHelper.get_username_and_repo_root(self)
secrets = WcaHelper.get_secrets(self)

admin_email = "admin@worldcubeassociation.org"
path = "/home/#{username}/.rbenv/shims:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games"

secrets_folder = "#{repo_root}/secrets"
db_dump_folder = "#{secrets_folder}/wca_db"
dump_db_command = "#{repo_root}/scripts/db.sh dump #{db_dump_folder}"
dump_gh_command = "github-backup --incremental --fork --private --all -t #{secrets['GITHUB_BACKUP_ACCESS_TOKEN']} --organization thewca -o #{secrets_folder}/github-thewca"
backup_command = "#{dump_db_command} && #{dump_gh_command}"
if node.chef_environment == "production"
  backup_command += " && #{repo_root}/scripts/backup.sh"
end

# Wrap the backup command to prepend a clear "FAILURE" message in case it fails.
tmp_logfile = "/tmp/cron-backup.log"
backup_command = "(#{backup_command})>#{tmp_logfile} 2>&1 || echo \"FAILURE of the backup script, see below for the error log:\"; cat #{tmp_logfile}"

unless node.chef_environment.start_with?("development")
  execute "pip3 install github-backup"

  cron "backup" do
    minute '0'
    hour '0'
    weekday '1'

    path path
    mailto admin_email
    user username
    command backup_command
  end
end

unless node.chef_environment.start_with?("development")
  cron "hourly schedule rails work" do
    minute '0'
    hour '*'
    weekday '*'

    path path
    mailto admin_email
    user username
    command "(cd #{repo_root}/WcaOnRails; RACK_ENV=production bin/rake work:schedule)"
  end
end

unless node.chef_environment.start_with?("development")
  cron "clear rails cache" do
    minute '0'
    hour '5'
    weekday '1,3,6'

    path path
    mailto admin_email
    user username
    command "(cd #{repo_root}/WcaOnRails; RACK_ENV=production bin/rake tmp:cache:clear)"
  end

  cron "send WST monthly chore" do
    minute '0'
    hour '8'
    day '23'

    path path
    mailto admin_email
    user username
    command "(cd #{repo_root}/WcaOnRails; RACK_ENV=production bin/rake chores:generate)"
  end
end

unless node.chef_environment.start_with?("development")
  cron "Send WEAT the draft for monthly digest" do
    minute '0'
    hour '0'
    day '1'

    path path
    mailto admin_email
    user username
    command "(cd #{repo_root}/WcaOnRails; RACK_ENV=production bin/rake send_weat_digest_content:generate)"
  end
end
