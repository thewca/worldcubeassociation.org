worldcubeassociation.org
========================

This repository contains all of the code that runs on [worldcubeassociation.org](https://www.worldcubeassociation.org/).

## Setup
- Install [Vagrant](https://www.vagrantup.com/), which requires
  [VirtualBox](https://www.virtualbox.org/).

## Run
- `vagrant up` - Once the VM finishes intializing, the website will be
  accessible at [http://localhost:8080](http://localhost:8080).

## TODO
- There are 4 `*.template` files in the `webroot/results/` directory.
  - `webroot/results/admin/.htaccess.template` - This needs an absolute path
    pointing to a .htpasswd file somewhere...
  - `webroot/results/includes/_config.php.template` - ...
  - `webroot/results/dev/.htaccess.template` - Can the whole dev/ directory go?
  - `webroot/results/.htaccess.template` - This seems like it could get moved
    up a level.
- Initializing and seeding the databases. I'd like to provide public database
  exports (scrubbed of sensitive data, of course) and have `bootstrap.sh`
  auto download and import these database exports.
- Drupal, phpBB, and the WCA regulations are not yet in this repository.
