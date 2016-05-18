#!/usr/bin/env bash

pull_latest() {
  # From http://stackoverflow.com/a/8084186
  git pull --recurse-submodules && git submodule update
}

rebuild_regs() {
  # Build WCA regulations
  # Use only one core because we get better backtraces without multiprocessing,
  # and because we might be on the production server and should not eat up all
  # cores just building the regulations.
  regulations/make.py --num-workers 1 --wca
  regs_folder=WcaOnRails/app/views/regulations
  if [ -a $regs_folder ]; then
    rm -rf $regs_folder-todelete
    mv $regs_folder $regs_folder-todelete
  fi
  mv regulations/build/regulations $regs_folder
  rm -rf $regs_folder-todelete
}

rebuild_rails() {
  (
    cd WcaOnRails

    if [ "$(git rev-parse --abbrev-ref HEAD)" == "production" ]; then
      export RAILS_ENV=production
    else
      export RAILS_ENV=development
    fi
    bundle install --without none
    bundle exec rake assets:clean assets:precompile

    # Note that we are intentionally not automating database migrations.

    # Kill all delayed_job workers.
    pkill -f "wca_worker/delayed_job"
    # Restart delayed_job worker.
    bin/delayed_job -p wca_worker --pool=mailers:1 --pool=*:1 start

    # Attempt to restart unicorn gracefully as per
    #  http://unicorn.bogomips.org/SIGNALS.html
    pid=$(<"pids/unicorn.pid")
    kill -SIGUSR2 $pid
    sleep 5
    kill -SIGQUIT $pid
  )
}

cd "$(dirname "$0")"/..
allowed_commands="pull_latest rebuild_rails rebuild_regs"
source scripts/_parse_args.sh
