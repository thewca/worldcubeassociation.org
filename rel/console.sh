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
  exit 1
}

# Check if AWS CLI is installed
printf "${COLOR_DEFAULT}AWS CLI | "
command -v aws >/dev/null 2>&1 && status="$?" || status="$?"
if [[ "${status}" = 0 ]]; then
  cliVersion=$(aws --version)
  printf "${COLOR_GREEN}OK ${COLOR_DEFAULT}(${cliVersion})\n"
else
  printf "${COLOR_RED}Missing\n"
  exit 1
fi

# Check whether the Session Manager plugin exists
printf "${COLOR_DEFAULT}Session Manager Plugin | "
command -v session-manager-plugin >/dev/null 2>&1 && status="$?" || status="$?"
if [[ "${status}" = 0 ]]; then
  smpVersion=$(session-manager-plugin --version)
  printf "${COLOR_GREEN}OK ${COLOR_DEFAULT}(${smpVersion})\n"
else
  printf "${COLOR_RED}Missing\n"
  exit 1;
fi

# Parse the environment argument
environment=""
while getopts ":e:" opt; do
  case $opt in
    e)
      environment=$OPTARG
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

if [[ "$environment" != "production" && "$environment" != "staging" ]]; then
  printf "${COLOR_RED}Invalid environment: $environment. Must be 'production' or 'staging'.\n"
  usage
fi

# Set container name based on environment
service_name="wca-on-rails-staging"
container_name="rails-staging"
if [ "$environment" = "production" ]; then
  service_name="wca-on-rails-prod"
  container_name="rails-production"
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
  --command "/rails/bin/rails c" \
  --interactive
