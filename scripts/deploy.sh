#!/usr/bin/env bash

pull_latest() {
  # From http://stackoverflow.com/a/8084186
  git pull --recurse-submodules && git submodule update
}

restart_app() {
  # Attempt to restart unicorn gracefully as per
  #  http://unicorn.bogomips.org/SIGNALS.html
  pid=$(<"WcaOnRails/pids/unicorn.pid")
  kill -SIGUSR2 $pid
  sleep 5
  kill -SIGQUIT $pid
}

rebuild_regs() {
  # Build WCA regulations
  # Uses wrc, see here: https://github.com/thewca/wca-regulations-compiler
  # pdf generations relies on wkhtmltopdf (with patched qt), which should be in $PATH
  build_folder=regulations/build
  regs_folder_root=WcaOnRails/app/views
  tmp_dir=/tmp/regs-todelete
  regs_folder=$regs_folder_root/regulations
  regs_version=$regs_folder/version
  regs_data_version=$regs_folder/data_version
  translations_version=$regs_folder/translations/version

  rm -rf $build_folder
  mkdir -p $build_folder

  # The /regulations directory build relies on three sources:
  #  - The WCA Regulations
  #  - The WCA Regulations translations
  #  - The 'regulations-data' branch of this repo, which contains data such as TNoodle binaries
  git_reg_hash=`git ls-remote https://github.com/thewca/wca-regulations.git official | sed 's/\(.\{7\}\).*/\1/'`
  git_translations_hash=`git ls-remote https://github.com/thewca/wca-regulations-translations.git HEAD | sed 's/\(.\{7\}\).*/\1/'`
  git_reg_data_hash=`git rev-parse --short origin/regulations-data`

  rebuild_regulations=1
  rebuild_regulations_data=1
  rebuild_translations=1
  # Check if the cloned regulations match the current version
  if [ -r $regs_version ] && [ "`cat $regs_version`" == "$git_reg_hash" ]; then
    rebuild_regulations=0
  fi
  # Check if the latest regulations-data match the current version
  if [ -r $regs_data_version ] && [ "`cat $regs_data_version`" == "$git_reg_data_hash" ]; then
    rebuild_regulations_data=0
  fi
  # Check if the cloned translations match the current version
  if [ -r $translations_version ] && [ "`cat $translations_version`" == "$git_translations_hash" ]; then
    rebuild_translations=0
  fi
  if [ $rebuild_regulations -eq 0 ] && [ $rebuild_translations -eq 0 ] && [ $rebuild_regulations_data -eq 0 ]; then
    echo "WCA Regulations and translations are up to date."
    return
  fi

  # Else we have to rebuild something

  # This saves tracked files that may have unstashed changes too
  cp -r $regs_folder $build_folder

  # Checkout data (scramble programs, history)
  # Assuming we ran pull_latest, this automatically checks out the latest regulations-data
  git checkout origin/regulations-data $build_folder
  git reset HEAD $build_folder

  if [ $rebuild_translations -eq 1 ]; then
    git clone --depth=1 https://github.com/thewca/wca-regulations-translations.git $build_folder/wca-regulations-translations
    languages=`wrc-languages`
    # Clean up translations directories
    find $build_folder/regulations/translations ! -name 'translations' -type d -exec rm -rf {} +
    # Rebuild all translations
    for kind in html pdf; do
      for l in $languages; do
        inputdir=$build_folder/wca-regulations-translations/${l}
        outputdir=$build_folder/regulations/translations/${l}
        mkdir -p $outputdir
        echo "Generating ${kind} for language ${l}"
        wrc --target=$kind -l $l -o $outputdir -g $git_translations_hash $inputdir
      done
    done
    # Update version built
    echo $git_translations_hash > $build_folder/regulations/translations/version
  else
    echo "Translations are up to date."
  fi

  outputdir=$build_folder/regulations
  if [ $rebuild_regulations -eq 1 ]; then
    git clone --depth=1 --branch=official https://github.com/thewca/wca-regulations.git $build_folder/wca-regulations
    # Clean up regulations directory files
    find $build_folder/regulations -maxdepth 1 -type f -exec rm -f {} +
    # Rebuild Regulations
    wrc --target=json -o $outputdir -g $git_reg_hash $build_folder/wca-regulations
    wrc --target=html -o $outputdir -g $git_reg_hash $build_folder/wca-regulations
    wrc --target=pdf -o $outputdir -g $git_reg_hash $build_folder/wca-regulations
    # Update version built
    echo $git_reg_hash > $build_folder/regulations/version
  else
    echo "Regulations are up to date"
  fi

  # Update regulations-data version built
  echo $git_reg_data_hash > $build_folder/regulations/data_version

  rm -rf $tmp_dir
  mv $regs_folder $tmp_dir
  mv $outputdir $regs_folder
  rm -rf $tmp_dir
}

restart_dj() {
  sudo supervisorctl restart workers:*
}

rebuild_rails() {
  (
    cd WcaOnRails

    bundle install
    bundle exec rake assets:clean assets:precompile

    # Note that we are intentionally not automating database migrations.
  )

  restart_dj
  restart_app
}

cd "$(dirname "$0")"/..

if [ "$(hostname)" == "production" ] || [ "$(hostname)" == "staging" ]; then
  export RAILS_ENV=production
else
  export RAILS_ENV=development
fi

allowed_commands="pull_latest restart_app restart_dj rebuild_rails rebuild_regs"
source scripts/_parse_args.sh
