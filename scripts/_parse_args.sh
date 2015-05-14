# From http://stackoverflow.com/a/8064551
listcontains() {
  for word in $1; do
    [[ $word = $2 ]] && return 0
  done
  return 1
}

# Validate command line arguments
print_usage_and_exit() {
  echo -n "Usage: $0 "
  for command in $allowed_commands; do
    echo -n "[$command] "
  done
  echo
  exit
}
if [ $# -lt 1 ]; then
  print_usage_and_exit
fi
for command in "$@"; do
  if ! listcontains "$allowed_commands" $command; then
    echo "Unrecognized command: $command"
    print_usage_and_exit
  fi
done

# Comands have been validated, so execute them!
# Show commands before running them.
set -ex
for command in "$@"; do
  $command
done
