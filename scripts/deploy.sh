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
  git_reg_hash=$(commit_hash "https://github.com/thewca/wca-regulations.git" official)
  git_translations_hash=$(commit_hash "https://github.com/thewca/wca-regulations-translations.git" HEAD)
  git_reg_data_hash=$(commit_hash "https://github.com/thewca/worldcubeassociation.org.git" regulations-data)

  rebuild_regulations=1
  rebuild_regulations_data=1
  rebuild_translations=1
  # Check if the cloned regulations match the current version
  if [ -r $regs_version ] && [ "$(cat $regs_version)" == "$git_reg_hash" ]; then
    rebuild_regulations=0
  fi
  # Check if the latest regulations-data match the current version
  if [ -r $regs_data_version ] && [ "$(cat $regs_data_version)" == "$git_reg_data_hash" ]; then
    rebuild_regulations_data=0
  fi
  # Check if the cloned translations match the current version
  if [ -r $translations_version ] && [ "$(cat $translations_version)" == "$git_translations_hash" ]; then
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
  git fetch https://github.com/thewca/worldcubeassociation.org.git regulations-data
  git checkout FETCH_HEAD $build_folder
  git reset HEAD $build_folder

  inputdir=$build_folder/wca-regulations-translations
  outputdir=$build_folder/regulations/translations
  mkdir -p $outputdir

  if [ $rebuild_translations -eq 1 ]; then
    git clone --depth=1 https://github.com/thewca/wca-regulations-translations.git $inputdir
    languages=$(wrc-languages)
    # Clean up translations directories
    find $outputdir ! -name 'translations' -type d -exec rm -rf {} +
    # Rebuild all translations
    for kind in html pdf; do
      for l in $languages; do
        lang_inputdir=$inputdir/${l}
        lang_outputdir=$outputdir/${l}
        mkdir -p $lang_outputdir
        echo "Generating ${kind} for language ${l}"
        wrc --target=$kind -l $l -o $lang_outputdir -g $git_translations_hash $lang_inputdir
        # Update timestamp for semi-automatic computation of translations index
        cp $lang_inputdir/metadata.json $lang_outputdir/
      done
    done
    # Update version built
    echo "$git_translations_hash" > $outputdir/version
    # Update timestamps for automatically determining which regulations are up to date
    cp $inputdir/version-date $outputdir/
  else
    echo "Translations are up to date."
  fi

  inputdir=$build_folder/wca-regulations
  outputdir=$build_folder/regulations
  mkdir -p $outputdir

  if [ $rebuild_regulations -eq 1 ]; then
    git clone --depth=1 --branch=official https://github.com/thewca/wca-regulations.git $inputdir
    # Clean up regulations directory files
    find $outputdir -maxdepth 1 -type f -exec rm -f {} +
    # Rebuild Regulations
    wrc --target=json -o $outputdir -g "$git_reg_hash" $inputdir
    wrc --target=html -o $outputdir -g "$git_reg_hash" $inputdir
    wrc --target=pdf -o $outputdir -g "$git_reg_hash" $inputdir
    # Update version built
    echo "$git_reg_hash" > $outputdir/version
  else
    echo "Regulations are up to date"
  fi

  # Update regulations-data version built
  echo "$git_reg_data_hash" > $outputdir/data_version

  rm -rf $tmp_dir
  mv $regs_folder $tmp_dir
  mv $outputdir $regs_folder
  rm -rf $tmp_dir
}

update_docs() {
  public_dir=WcaOnRails/public
  tmp_dir=/tmp/wca-documents-clone

  rm -rf $tmp_dir
  git clone --depth=1 --branch=build https://github.com/thewca/wca-documents.git $tmp_dir
  rm -rf $public_dir/documents
  rm -rf $public_dir/edudoc
  mv $tmp_dir/documents $tmp_dir/edudoc $public_dir
}

restart_dj() {
  sudo supervisorctl update
  sudo supervisorctl restart workers:*
}

rebuild_rails() {
  (
    cd WcaOnRails

    bundle install
    bundle exec rake yarn:install
    # We used to run 'assets:clean' as part of the command below, but for some
    # reason rake would clean *up-to-date* assets and not recompile them, leading
    # to the website being simply broken...
    # See https://github.com/thewca/worldcubeassociation.org/issues/5370
    bundle exec rake assets:precompile

    # Note that we are intentionally not automating database migrations.
  )

  restart_dj
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

allowed_commands="pull_latest restart_app restart_dj rebuild_rails rebuild_regs update_docs"
source scripts/_parse_args.sh
