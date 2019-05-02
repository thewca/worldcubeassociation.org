# worldcubeassociation.org [![Build Status](https://travis-ci.org/thewca/worldcubeassociation.org.svg?branch=master)](https://travis-ci.org/thewca/worldcubeassociation.org) [![Coverage Status](https://coveralls.io/repos/github/thewca/worldcubeassociation.org/badge.svg?branch=master)](https://coveralls.io/github/thewca/worldcubeassociation.org?branch=master)

This repository contains all of the code that runs on [worldcubeassociation.org](https://www.worldcubeassociation.org/).

## Setup
- `git clone https://github.com/thewca/worldcubeassociation.org` - Clone this repo! (And navigate into it, `cd worldcubeassociation.org`)
- `(cd WcaOnRails; bundle install && bundle exec pre-commit install) && git config pre-commit.ruby "scripts/ruby_in_wca_on_rails.sh"` - Set up git pre-commit hook. Optional, but very useful.

## Run directly with Ruby (lightweight, but only runs the Rails portions of the site)
- Set up MySQL with a user with username "root" with an empty password.
  If it poses problems, try the following:
  ```shell
  # Install MySQL if you hadn't already.
  # Using apt that would be: sudo apt install mysql-server
  # Then run MySQL CLI as administrator and set an empty password for the root user:
  sudo mysql -u root
  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
  ```
- Install dependencies and load development database.
  1. `cd WcaOnRails/`
  2. `bundle install && bin/yarn`
  3. `bin/rake db:load:development` - Download and import the [developer's database export](https://github.com/thewca/worldcubeassociation.org/wiki/Developer-database-export).
  4. `bin/rails server` - Run rails. The server will be accessible at localhost:3000
- Run tests.  Setup instructions follow `before_script` in `.travis.yml`.
  1. `RAILS_ENV=test bin/rake db:reset` - Set up test database.
  2. `RAILS_ENV=test bin/rake assets:precompile` - Compile some assets needed for tests to run.
  3. `bin/rspec` - Run tests.
- [Mailcatcher](http://mailcatcher.me/) is a good tool for catching emails in development.

## Run in Vagrant (gets everything working, but is very slow, recommended only if you need to run the PHP portions of the website)
- Install [Vagrant](https://www.vagrantup.com/), which requires
  [VirtualBox](https://www.virtualbox.org/).
- `vagrant up all` - Once the VM finishes initializing (which can take some time),
  the website will be accessible at [http://localhost:2331](http://localhost:2331).
  - Note: There are some minor [issues with development on Windows](https://github.com/thewca/worldcubeassociation.org/issues/393).
- All emails will be accessible at `http://localhost:2332`.
- Please take a look at this [wiki page](https://github.com/thewca/worldcubeassociation.org/wiki/Misc.-important-commands-to-know) for more detailed informations about the application's internals.

# Production

See [Spinning up a new server](https://github.com/thewca/worldcubeassociation.org/wiki/Spinning-up-a-new-server) and
[Merging and deploying](https://github.com/thewca/worldcubeassociation.org/wiki/Merging-and-deploying).
