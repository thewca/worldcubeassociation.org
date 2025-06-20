#!/bin/bash
set -euo pipefail

# This script connects to one of the running ECS tasks and opens an
# interactive rails shell attached directly to the running system.
# Idea stolen from https://github.com/thewca/wca-live/blob/main/rel/console.sh
# You will need to have AWS CLI + Systems Manager Addon installed and credentials configured
# in a profile called 'wca'

# Colors for output
COLOR_DEFAULT='\033[0m'
COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'

export AWS_DEFAULT_PROFILE=wca

usage() {
  printf "${COLOR_DEFAULT}Usage: $0 -e <environment>\n"
  printf " -e <environment>  Specify the environment (production or staging)"
  printf " -b: Run a bash shell instead of the default command"
  printf " -n: Connect to Nextjs"
  exit 1
}

# Check if AWS CLI is installed
printf "${COLOR_DEFAULT}AWS CLI | "
if command -v aws >/dev/null 2>&1; then
  cliVersion=$(aws --version)
  printf "${COLOR_GREEN}OK ${COLOR_DEFAULT}(${cliVersion})\n"
else
  printf "${COLOR_RED}Missing\n"
  exit 1
fi

# Check whether the Session Manager plugin exists
printf "${COLOR_DEFAULT}Session Manager Plugin | "
if command -v session-manager-plugin >/dev/null 2>&1; then
  smpVersion=$(session-manager-plugin --version)
  printf "${COLOR_GREEN}OK ${COLOR_DEFAULT}(${smpVersion})\n"
else
  printf "${COLOR_RED}Missing\n"
  exit 1;
fi

# Check if you are connected to the AWS WCA Account
printf "${COLOR_DEFAULT}aws wca credentials | "
account=$(aws iam list-account-aliases --query "AccountAliases[0]" --output text )
if [[ "${account}" == "thewca" ]]; then
  role=$(aws sts get-caller-identity --query "Arn" --output text )
  printf "${COLOR_GREEN}OK ${COLOR_DEFAULT} (Logged in as ${role})\n"
else
  printf "${COLOR_RED}Missing, make sure you have a AWS CLI profile called 'wca' that is connected to the WCA AWS account\n"
  exit 1;
fi

# Parse the environment argument
nextjs=false
environment=""
command="/rails/bin/rails c"
while getopts ":e:bnh" opt; do
  case $opt in
    e)
      environment=$OPTARG
      ;;
    b)
      command="/bin/bash"
      ;;
    n)
      command="/bin/sh"
      nextjs=true
      ;;
    h)
      usage
      ;;
    \?)
      printf "${COLOR_RED}Invalid option: -$OPTARG \n" >&2
      usage
      ;;
    :)
      printf "${COLOR_RED}Option -$OPTARG requires an argument. \n" >&2
      usage
      ;;
  esac
done

# Validate environment argument
if [ -z "$environment" ]; then
  printf "${COLOR_RED}Environment not specified.\n"
  usage
fi

case "$environment" in
  "production")
    service_name="wca-on-rails-prod"
    container_name="rails-production"
  ;;

  "staging")
    service_name="wca-on-rails-staging"
    container_name="rails-staging"
  ;;

  *)
    printf "${COLOR_RED}Invalid environment: $environment. Must be 'production' or 'staging'.\n"
    usage
  ;;
esac

if [ "$nextjs" == "true" ]; then
  service_name="wca-on-rails-prod-nextjs-production"
  container_name="nextjs-production"
fi

task_arn="$(
  aws ecs list-tasks \
    --region us-west-2 \
    --cluster wca-on-rails \
    --service-name $service_name \
    --query "taskArns[0]" \
    --output text
)"

aws ecs execute-command  \
  --region us-west-2 \
  --cluster wca-on-rails \
  --task $task_arn \
  --container $container_name \
  --command "$command" \
  --interactive
