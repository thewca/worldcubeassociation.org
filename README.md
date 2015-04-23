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
- `wget --user=USERNAME --password=PASSWORD https://www.worldcubeassociation.org/results/admin/dump/worldcubeassociation.org_alldbs.tar.gz` - Download full database export.
- `vagrant up` - Once the VM finishes intializing, the website will be
  accessible at [http://localhost:8080](http://localhost:8080).
