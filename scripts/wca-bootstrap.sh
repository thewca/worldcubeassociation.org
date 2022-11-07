#!/usr/bin/env bash

print_usage_and_exit() {
  echo "Usage: $0 <environment>"
  echo "Bootstraps a WCA server."
  echo "<environment> must be one of development, staging, production."
  exit 1
}
if [ $# -gt 1 ]; then
  print_usage_and_exit
fi
environment=$1
if [ "$environment" == "development" ] || [ "$environment" == "staging" ] || [ "$environment" == "production" ]; then
  git_branch=master
else
  echo "Unrecognized environment: $environment"
  print_usage_and_exit
fi

if [ "$(id -u)" != "0" ]; then
  echo "This script must be run as root" 2>&1
  exit 1
fi

set -ex

# Install deps required to bootstrap
apt-get update -y
if ! command -v curl &> /dev/null; then
  # OVH's Ubuntu 14.04 doesn't have curl
  apt-get install -y curl
fi
if ! command -v git &> /dev/null; then
  apt-get install -y git
fi
if ! command -v gcc &> /dev/null; then
  apt-get install -y build-essential
fi

if [ -d /vagrant ]; then
  repo_root=/vagrant
else
  repo_root=/home/cubing/worldcubeassociation.org

  # Create cubing user if does not exist.
  if ! id -u cubing &>/dev/null; then
    useradd -m -s /bin/bash cubing
    chown cubing:cubing /home/cubing
  fi

  # Check out codebase =)
  export GIT_SSH=/tmp/ssh-no-hostkeychecking.sh
  if ! command -v $GIT_SSH &> /dev/null; then
    cat > $GIT_SSH <<EOL
#!/usr/bin/env bash
exec /usr/bin/ssh -o StrictHostKeyChecking=no "\$@"
EOL
    chmod +x /tmp/ssh-no-hostkeychecking.sh
  fi
  # Let the root user do the git-ing, and then chown appropriately.
  if ! [ -d $repo_root ]; then
    git clone -b $git_branch https://github.com/thewca/worldcubeassociation.org.git $repo_root
  else
    (
      cd $repo_root
      git pull
    )
  fi
  chown -R cubing:cubing $repo_root
fi

if [ "$environment" != "development" ]; then
  # Download secrets that are required to provision a new server.
  # You'll need ssh access to worldcubeassociation.org as user `cubing`. Contact
  # software-admins@worldcubeassociation.org if you need access.
  echo "Downloading secrets from worldcubeassociation.org..."
  rsync -az -e "ssh -o StrictHostKeyChecking=no" --info=progress2 cubing@worldcubeassociation.org:/home/cubing/worldcubeassociation.org/secrets/ $repo_root/secrets
fi

# Install chef client
if ! command -v chef-solo &> /dev/null || ! chef-solo --version | grep 16.17.51 &> /dev/null; then
  curl -Ls https://omnitruck.chef.io/install.sh | bash -s -- -v 16.17.51
  /opt/chef/embedded/bin/gem install berkshelf -v "7.2.2"
fi

berks_lib_file=$(/opt/chef/embedded/bin/gem which berkshelf)
berks_lib_dir=$(dirname "$berks_lib_file")
berks_root_dir=$(dirname "$berks_lib_dir")

berks_executable="$berks_root_dir/bin/berks"

# Install cookbooks from Cheffile
(
  cd $repo_root/chef
  /opt/chef/embedded/bin/ruby "$berks_executable" install
  /opt/chef/embedded/bin/ruby "$berks_executable" vendor "$repo_root/chef/cookbooks"
)

mkdir -p /etc/chef
cat > /etc/chef/solo.rb <<EOL
node_name "$environment"
environment "$environment"
file_cache_path "/var/chef/cache"
file_backup_path "/var/chef/backup"
cookbook_path ["$repo_root/chef/cookbooks", "$repo_root/chef/site-cookbooks"]
role_path "$repo_root/chef/roles"
environment_path "$repo_root/chef/environments"
node_path "$repo_root/chef/nodes"
data_bag_path "$repo_root/chef/data_bags"
encrypted_data_bag_secret "$repo_root/secrets/my_secret_key"
log_level :info
verbose_logging false
local_mode true
chef_license "accept"
ohai.optional_plugins << :Passwd
EOL
chef-solo --legacy-mode --config "/etc/chef/solo.rb" -o 'role[wca]'
