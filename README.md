worldcubeassociation.org
========================

This repository contains all of the code that runs on [worldcubeassociation.org](https://www.worldcubeassociation.org/).

## Setup
- Install [Vagrant](https://www.vagrantup.com/), which requires
  [VirtualBox](https://www.virtualbox.org/).
- `git clone https://github.com/cubing/worldcubeassociation.org` - Clone this repo! (And navigate into it, `cd worldcubeassociation.org`)
- `git submodule update --init --recursive` - Initialize submodules. (Note: you will need to have access to the [cubing/wca-website-php](https://github.com/cubing/wca-website-php) repo, and an [SSH key](https://help.github.com/articles/generating-ssh-keys/) set up for this.)
- `(cd WcaOnRails; bundle install) && pre-commit install` - Set up git pre-commit hook. Optional, but very useful.

## Run
- `vagrant up` - Once the VM finishes initializing (which can take some time),
  the website will be accessible at [http://localhost:8080](http://localhost:8080).
  - Unfortunately, spinning up a development environment requires a database
    dump. We intend to remove that requirement in the future, but until then,
    please contact software-admins@worldcubeassociation.org if you need access.

## Provision New VM
- Provisioning relies upon SSH agent forwarding, so make sure you've set up SSH
  keys for GitHub ([howto](https://help.github.com/articles/generating-ssh-keys/)).
  You also need an SSH key set up for cubing@worldcubeassociation.org in order
  to rsync secrets.
- `time ssh -A user@example.com 'sudo wget https://raw.githubusercontent.com/cubing/worldcubeassociation.org/master/scripts/wca-bootstrap.sh -O /tmp/wca-bootstrap.sh && sudo -E bash /tmp/wca-bootstrap.sh staging/production'`

## Deploy
- `ssh -A cubing@worldcubeassociation.org worldcubeassociation.org/scripts/deploy.sh pull_latest rebuild_rails rebuild_regs`

## Secrets
- Production secrets are stored in an encrypted chef [data bag](https://docs.chef.io/data_bags.html) at `chef/data_bags/secrets/production.json`.
  - Show secrets: `knife data bag show secrets production -c /etc/chef/solo.rb --secret-file secrets/my_secret_key`
  - Edit secrets: `knife data bag edit secrets production -c /etc/chef/solo.rb --secret-file secrets/my_secret_key`
