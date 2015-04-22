worldcubeassociation.org
========================

This repository contains all of the code that runs on [worldcubeassociation.org](https://www.worldcubeassociation.org/).

## Setup
- Install [Vagrant](https://www.vagrantup.com/), which requires
  [VirtualBox](https://www.virtualbox.org/).
- `git submodule update --init --recursive` - This project uses a git submodule
  to avoid copying the results code from the
  [cubing/wca-website-php](https://github.com/cubing/wca-website-php)
  repository.

## Run
- `vagrant up` - Once the VM finishes intializing, the website will be
  accessible at [http://localhost:8080](http://localhost:8080).
- `vagrant ssh -c 'bash -c /vagrant/setup_db_interactive.sh'` - For now,
  seeding the database must be done manually.
  `/vagrant/setup_db_interactive.sh` will prompt
  you for your https://www.worldcubeassociation.org/results/admin/ credentials.
  The plan is for these exports to eventually be publically available, and this
  manual step will not longer be required.
