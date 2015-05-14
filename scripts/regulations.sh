#!/usr/bin/env bash

pull_latest() {
  # From http://stackoverflow.com/a/8084186
  git pull --recurse-submodules && git submodule update
}

rebuild_regs() {
  # Build WCA regulations
  wca-documents-extra/make.py --verbose --setup-wca-documents --wca
  if [ -a webroot/regulations ]; then
    rm -rf webroot/regulations-todelete
    mv webroot/regulations webroot/regulations-todelete;
  fi
  mv wca-documents-extra/build/regulations webroot/
  rm -rf webroot/regulations-todelete
}

rebuild_rails() {
  (
    cd WcaOnRails
    bundle install --without none
    bundle exec rake assets:clean assets:precompile

    # Note that we are intentionally not automating database migrations.

    # Attempt to restart unicorn gracefully as per
    #  http://unicorn.bogomips.org/SIGNALS.html
    pid=$(<"WcaOnRails/pids/unicorn.pid")
    kill -SIGUSR2 $pid
    sleep 5
    kill -SIGQUIT $pid
  )
}

cd "$(dirname "$0")"/..
allowed_commands="pull_latest rebuild_rails rebuild_regs"
source scripts/_parse_args.sh
