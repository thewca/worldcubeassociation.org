worldcubeassociation.org
========================

This repository contains all of the code that runs on [worldcubeassociation.org](https://www.worldcubeassociation.org/).

NOTE: Currently, serving of static files doesn't work on Windows because it relies
upon symlinks to get apache to serve content outside of the DocumentRoot. There
are some things we could try to get this working on Windows, please comment
on this [issue](https://github.com/cubing/worldcubeassociation.org/issues/11) if
you're interested in helping out.

## Setup
- Install [Vagrant](https://www.vagrantup.com/), which requires
  [VirtualBox](https://www.virtualbox.org/).
- `git clone https://github.com/cubing/worldcubeassociation.org` - Clone this repo! (And navigate into it, `cd worldcubeassociation.org`)
- `git submodule update --init --recursive` - Initialize submodules. (Note: you will need to have access to the [cubing/wca-website-php](https://github.com/cubing/wca-website-php) repo, and an [SSH key](https://help.github.com/articles/generating-ssh-keys/) set up for this.)
- `(cd WcaOnRails; bundle install) && pre-commit install` - Set up git pre-commit hook. Optional, but very useful.

## Run
- `vagrant up dev` - Once the VM finishes initializing (which can take some time),
  the website will be accessible at [http://localhost:8080](http://localhost:8080).

## Provision New VM
- Provisioning relies upon SSH agent forwarding, so make sure you've set up SSH
  keys for GitHub ([howto](https://help.github.com/articles/generating-ssh-keys/)).
- `(cd secrets; scp cubing@worldcubeassociation.org:~/worldcubeassociation.org/secrets/my_secret_key my_secret_key; wget --user=<USERNAME> --password=<PASSWORD> https://www.worldcubeassociation.org/results/admin/dump/worldcubeassociation.org_alldbs.tar.gz)` - Download secrets/my_secret_key and secrets/worldcubeassociation.org_alldbs.tar.gz (you'll need access to the admin section of the WCA website for this to work).
- `time DIGITAL_OCEAN_API_KEY=<API_KEY> vagrant up staging|production --provider=digital_ocean`
# TODO - scripts to run at startup:
#  echo "Compute auxiliary data..."
#  time curl 'http://localhost/results/admin/compute_auxiliary_data.php?doit=+Do+it+now+'
#
#  echo "Update missing averages..."
#  time curl 'http://localhost/results/misc/missing_averages/update7205.php'
#
#  echo "Update Evolution of Records..."
#  time curl 'http://localhost/results/misc/evolution/update7205.php'


## Deploy
- TODO
- `ssh staging.worldcubeassociation.org pkill -U gjcomps -f rails`

## Secrets
- Production secrets are stored in an encrypted chef [data bag](https://docs.chef.io/data_bags.html) at `chef/data_bags/secrets/all.json`.
  - Show secrets: `knife data bag show secrets all -c /tmp/vagrant-chef/solo.rb --secret-file /secrets/my_secret_key`
  - Edit secrets: `knife data bag edit secrets all -c /tmp/vagrant-chef/solo.rb --secret-file /secrets/my_secret_key`
