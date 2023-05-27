username, repo_root = WcaHelper.get_username_and_repo_root(self)

admin_email = "admin@worldcubeassociation.org"
path = "/home/#{username}/.rbenv/shims:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games"

backup_command = " #{repo_root}/scripts/backup.sh"

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
