#!/usr/bin/env bash

print_usage_and_exit() {
  echo "Usage: $0 [environment]"
  echo "Bootstrap a WCA server."
  echo "environment must be one of development, staging, production."
  exit 1
}
if [ $# -gt 1 ]; then
  print_usage_and_exit
fi

environment=$1
if [ "$environment" != "development" ] && [ "$environment" != "staging" ] && [ "$environment" != "production" ]; then
  echo "Unrecognized environment: $environment"
  print_usage_and_exit
fi

if [ "$(id -u)" != "0" ]; then
  echo "This script must be run as root" 2>&1
  exit 1
fi

set -e

if test -d /vagrant; then
  repo_dir=/vagrant
else
  repo_dir=/home/cubing/worldcubeassociation.org

  # Create cubing user if does not exist.
  if ! id -u cubing &>/dev/null; then
    useradd cubing
    mkdir -p /home/cubing
    chown cubing:cubing /home/cubing
  fi

  # Check out codebase =)
  if ! command -v git &> /dev/null; then
    # Install the latest git so we can make use of GIT_SSH_COMMAND
    #  http://linuxg.net/how-to-install-git-2-3-0-on-ubuntu-15-04-ubuntu-14-10-ubuntu-14-04-ubuntu-12-04-and-derivative-systems/
    add-apt-repository -y ppa:git-core/ppa
    apt-get update -y
    apt-get install -y git
  fi
  if ! test -d $repo_dir; then
    GIT_SSH_COMMAND='ssh -o StrictHostKeyChecking=no' git clone --recursive git@github.com:cubing/worldcubeassociation.org.git $repo_dir
    chown -R cubing:cubing $repo_dir
  fi
fi

if [ "$environment" != "development" ]; then
  # Download database export and other secrets that are required to provision a new server.
  # You'll need ssh access to worldcubeassociation.org as user `cubing`. Contact
  # software-admins@worldcubeassociation.org if you need access.
  echo "Downloading secrets from worldcubeassociation.org..."
  rsync -a -e "ssh -o StrictHostKeyChecking=no" --info=progress2 cubing@worldcubeassociation.org:/home/cubing/worldcubeassociation.org/secrets/ $repo_dir/secrets
fi

# Install chef client and berks
if ! command -v berks &> /dev/null; then
  curl -Ls https://www.opscode.com/chef/install.sh | bash -s -- -v 12.3.0-1
  /opt/chef/embedded/bin/gem install librarian-chef
fi

# Install cookbooks from Cheffile
(
  cd $repo_dir/chef
  /opt/chef/embedded/bin/ruby /opt/chef/embedded/lib/ruby/gems/2.1.0/gems/librarian-chef-0.0.4/bin/librarian-chef install
)

mkdir -p /etc/chef
cat > /etc/chef/solo.rb <<EOL
node_name "$environment"
environment "$environment"
file_cache_path "/var/chef/cache"
file_backup_path "/var/chef/backup"
cookbook_path ["$repo_dir/chef/cookbooks", "$repo_dir/chef/site-cookbooks"]
role_path "$repo_dir/chef/roles"
environment_path "$repo_dir/chef/environments"
node_path "$repo_dir/chef/nodes"
data_bag_path "$repo_dir/chef/data_bags"
encrypted_data_bag_secret "$repo_dir/secrets/my_secret_key"
log_level :info
verbose_logging false
local_mode true
EOL
chef-solo -o 'role[wca]'
