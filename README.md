worldcubeassociation.org
========================

This repository contains all of the code that runs on [worldcubeassociation.org](https://www.worldcubeassociation.org/).

## Setup a development environment
### Setup a virtual machine and provision it - using Vagrant
- Install [Vagrant](https://www.vagrantup.com/), which requires [VirtualBox](https://www.virtualbox.org/).
- `git clone https://github.com/cubing/worldcubeassociation.org` - Clone this repo! (And navigate into it, `cd worldcubeassociation.org`)
- `git submodule update --init --recursive` - Initialize submodules.
- `(cd WcaOnRails; bundle install) && pre-commit install` - Set up git pre-commit hook. Optional, but very useful.
- `vagrant up noregs` - Start the VM and provision it.
  - Note: Starting up the `noregs` vm is much faster than the `all` vm, because the dependencies required to build the WCA regulations take *ages* to install.
- The website should now be accessible at [http://localhost:2331](http://localhost:2331).

### Install the website on a machine you've setup yourself
- Setup a machine (ie Ubuntu Trusty) with SSH access
- Make sure SSH Agent is running or start it with `eval "$(ssh-agent -s)"`
- Load your GitHub key into the ssh agent by doing `ssh-add /path/to/key`. If you don't have an SSH key, check the [GitHub howto](https://help.github.com/articles/generating-ssh-keys/)
- SSH into the machine, with agent-forwarding enabled : `ssh -A you@yourmachine`
- Provison your machine with `sudo wget https://raw.githubusercontent.com/cubing/worldcubeassociation.org/master/scripts/wca-bootstrap.sh -O /tmp/wca-bootstrap.sh && sudo -E bash /tmp/wca-bootstrap.sh [environment]` `[environment]` must be one of `development`, `development-noregs`, `staging`, `production`. This step will take a very long time (at least an hour)
  - For the `staging` and `production` environment, you will need an SSH key set up or know the password for cubing@worldcubeassociation.org in order to rsync secrets.
  - The bootstrapping part may fail while trying to install `texlive-lang-all`, in that case you can run `sudo apt-get install texlive-lang-all=2013.20140215-1` manually and then continue the bootstrapping process with `sudo -E bash /tmp/wca-bootstrap.sh [environment]`.
- The website should now being served on port 80. The traffic will be redirected to https (443) for `staging` and `production` environments.

## Deploy (aka update local git repo and rebuild rails and regulations)
- `ssh -A cubing@worldcubeassociation.org worldcubeassociation.org/scripts/deploy.sh pull_latest rebuild_rails rebuild_regs`

## Secrets
- Production secrets are stored in an encrypted chef [data bag](https://docs.chef.io/data_bags.html) at `chef/data_bags/secrets/production.json`.
  - Show secrets: `knife data bag show secrets production -c /etc/chef/solo.rb --secret-file secrets/my_secret_key`
  - Edit secrets: `knife data bag edit secrets production -c /etc/chef/solo.rb --secret-file secrets/my_secret_key`
