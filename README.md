# worldcubeassociation.org [![Build Status](https://travis-ci.org/thewca/worldcubeassociation.org.svg?branch=master)](https://travis-ci.org/thewca/worldcubeassociation.org)

This repository contains all of the code that runs on [worldcubeassociation.org](https://www.worldcubeassociation.org/).

## Setup
- Install [Vagrant](https://www.vagrantup.com/), which requires
  [VirtualBox](https://www.virtualbox.org/).
- `git clone https://github.com/thewca/worldcubeassociation.org` - Clone this repo! (And navigate into it, `cd worldcubeassociation.org`)
- `(cd WcaOnRails; bundle install) && pre-commit install` - Set up git pre-commit hook. Optional, but very useful.
- `echo "{}" > WcaOnRails/app/views/regulations/wca-regulations.json` - Set up an empty wca-regulations.json file to ensure api tests pass. Alternatively, you can build the Regulations locally by following [this guide](https://github.com/thewca/worldcubeassociation.org/wiki/Building-Regulations-locally).

## Run in Vagrant (easier and gets everything working)
- `vagrant up all` - Once the VM finishes initializing (which can take some time),
  the website will be accessible at [http://localhost:2331](http://localhost:2331).
  - Note: There are some minor [issues with development on Windows](https://github.com/thewca/worldcubeassociation.org/issues/393).
- All emails will be accessible at `http://localhost:2332`.
- Please take a look at this [wiki page](https://github.com/thewca/worldcubeassociation.org/wiki/Misc.-important-commands-to-know) for more detailed informations about the application's internals.

## Run locally ruby (lightweight, but only run the rails portions of the site)
- We don't support development with sqlite3, you'll need to set up MySQL.
- [Mailcatcher](http://mailcatcher.me/) is a good tool for catching emails in development.

## Provision New VM
- Provisioning relies upon SSH agent forwarding, so make sure you've set up an SSH
  key for cubing@worldcubeassociation.org in order to rsync secrets.
- `time ssh -A user@example.com 'sudo wget https://raw.githubusercontent.com/thewca/worldcubeassociation.org/master/scripts/wca-bootstrap.sh -O /tmp/wca-bootstrap.sh && sudo -E bash /tmp/wca-bootstrap.sh <environment>' - Where `environment` is one of `staging` or `production``

## Deploy

See [this wiki](https://github.com/thewca/worldcubeassociation.org/wiki/Merging-and-deploying).

## Secrets
- Production secrets are stored in an encrypted chef [data bag](https://docs.chef.io/data_bags.html) at `chef/data_bags/secrets/production.json`.
  - Show secrets: `knife data bag show secrets production -c /etc/chef/solo.rb --secret-file secrets/my_secret_key`
  - Edit secrets: `knife data bag edit secrets production -c /etc/chef/solo.rb --secret-file secrets/my_secret_key`
