#!/usr/bin/env bash

pull_latest() {
  # From http://stackoverflow.com/a/8084186
  git pull --recurse-submodules && git submodule update
}

restart_app() {
  if ps -efw | grep "unicorn master" | grep -v grep; then
    # Found a unicorn master process, restart it gracefully as per
    #  http://unicorn.bogomips.org/SIGNALS.html
    pid=$(<"WcaOnRails/pids/unicorn.pid")
    kill -SIGUSR2 $pid
    sleep 5
    kill -SIGQUIT $pid
  else
    # We could not find a unicorn master process running, lets start one up!
    (cd WcaOnRails; bundle exec unicorn -D -c config/unicorn.rb)
  fi
}

commit_hash() {
  REMOTE_URL=$1
  REMOTE_BRANCHNAME=$2

  echo $(git ls-remote $REMOTE_URL $REMOTE_BRANCHNAME | sed 's/\(.\{7\}\).*/\1/')
}

restart_sidekiq() {
  systemctl --user restart sidekiq
}

rebuild_rails() {
  (
    cd WcaOnRails

    bundle install
    bundle exec rake yarn:install
    bundle exec i18n export
    # We used to run 'assets:clean' as part of the command below, but for some
    # reason rake would clean *up-to-date* assets and not recompile them, leading
    # to the website being simply broken...
    # See https://github.com/thewca/worldcubeassociation.org/issues/5370
    bundle exec rake assets:precompile

    # Note that we are intentionally not automating database migrations.
  )

  restart_sidekiq
  restart_app

  echo "/!\\ Cleaning assets automatically has been disabled /!\\"
  echo "Once in a while (preferably when low traffic) we need to clear the "
  echo "public/packs directory and recompile them."
  echo "If you're performing the weekly dependencies updates, I suggest you to do that."
}

cd "$(dirname "$0")"/..

if [ "$(hostname)" == "production" ] || [ "$(hostname)" == "staging" ]; then
  export RACK_ENV=production
else
  export RACK_ENV=development
fi

# Workaround for https://github.com/rails/webpacker/issues/773
export RAILS_ENV=${RACK_ENV}

# load rbenv into PATH
eval "$("$HOME/.rbenv/bin/rbenv" init -)"

allowed_commands="pull_latest restart_app restart_sidekiq rebuild_rails"
source scripts/_parse_args.sh
