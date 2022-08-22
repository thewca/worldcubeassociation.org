#!/usr/bin/env bash

set -e

cd "$(dirname "$0")"

PRODUCTION_SERVER_NAME="www.worldcubeassociation.org"
OLD_PRODUCTION_SERVER_NAME="DELETEME_old_${PRODUCTION_SERVER_NAME}"
PRODUCTION_ELASTIC_IP="34.208.140.116"
TEMP_NEW_PROD_SERVER_NAME="temp-new-prod-server-via-cli"

STAGING_SERVER_NAME="staging.worldcubeassociation.org"
STAGING_TARGET_GROUP="arn:aws:elasticloadbalancing:us-west-2:285938427530:targetgroup/staging-main/bd9e7969ecfdba09"
PROD_TARGET_GROUP="arn:aws:elasticloadbalancing:us-west-2:285938427530:targetgroup/production-main/2e6a4c44af364e04"
OLD_STAGING_SERVER_NAME="DELETEME_old_${STAGING_SERVER_NAME}"
STAGING_ELASTIC_IP="52.10.200.132"
TEMP_NEW_STAGING_SERVER_NAME="temp-new-staging-server-via-cli"

AWS_REGION="us-west-2"

CONFIGURATION_INSTRUCTIONS="https://docs.google.com/document/d/1cq-4R0ERnK-dGNlkoG8gwKKjr5WecuXSppbSHQ0FI9s/edit#heading=h.qsrd2h8spn50"

check_deps() {
  if ! command -v jq &>/dev/null; then
    echo "Unable to find the jq command line utility. Are you sure it's installed?" >> /dev/stderr
    echo "Try following the installation instructions here: https://stedolan.github.io/jq/download/" >> /dev/stderr
    exit 1
  fi

  if ! command -v aws &>/dev/null; then
    echo "Unable to find the aws command line client. Are you sure it's installed?" >> /dev/stderr
    echo "Try following the installation instructions here: https://docs.aws.amazon.com/cli/latest/userguide/installing.html" >> /dev/stderr
    exit 1
  fi

  if ! command -v dig &>/dev/null; then
    echo "Unable to find the dig command line utility. Are you sure it's installed?" >> /dev/stderr
    exit 1
  fi

  test_aws_cli
}

test_aws_cli() {
  local configured_region=`aws configure get region`
  if [ "${configured_region}" != "${AWS_REGION}" ]; then
    echo "Found the aws command line client, but your region is configured to be '${configured_region}', when it should be '${AWS_REGION}'." >> /dev/stderr
    echo "Try following the configuration instructions here: ${CONFIGURATION_INSTRUCTIONS}" >> /dev/stderr
    exit 1
  fi

  local configured_output=`aws configure get output`
  if [ "${configured_output}" != "json" ]; then
    echo "Found the aws command line client, but your default output format is configured to be '${configured_output}', when it should be 'json'." >> /dev/stderr
    echo "Try following the configuration instructions here: ${CONFIGURATION_INSTRUCTIONS}" >> /dev/stderr
    exit 1
  fi
}

test_ssh_to_server() {
  local host=$1
  local test_command="ssh -o PasswordAuthentication=no -o StrictHostKeyChecking=no cubing@${host} echo Successfulness"
  local connected_str=`${test_command} || true`
  if [ "${connected_str}" != "Successfulness" ]; then
    echo "" >> /dev/stderr
    echo "Unable to connect to the current server." >> /dev/stderr
    echo "You need to set up passwordless ssh to production locally before spinning up a new server." >> /dev/stderr
    echo "If you do not know how to do this, look into ssh-copy-id." >> /dev/stderr
    echo "When you think you've got things set up correctly, try running '${test_command}'." >> /dev/stderr
    exit 1
  fi
}

test_ssh_agent_forwarding() {
  local ssh_command=$1
  local host=$2

  test_ssh_to_server ${host}

  local test_command="${ssh_command} echo Successfulness"
  local connected_str=`${test_command} || true`
  if [ "${connected_str}" != "Successfulness" ]; then
    echo "" >> /dev/stderr
    echo "Unable to connect to the new server." >> /dev/stderr
    echo "When you think you've got things set up correctly, try running '${test_command}'." >> /dev/stderr
    exit 1
  fi

  local test_command="${ssh_command} ssh -o PasswordAuthentication=no -o StrictHostKeyChecking=no cubing@${host} echo Successfulness"
  local connected_str=`${test_command} || true`
  if [ "${connected_str}" != "Successfulness" ]; then
    echo "" >> /dev/stderr
    echo "Unable to connect to the current server through the newly created server." >> /dev/stderr
    echo "This is indicative of a problem with your ssh agent forwarding. GitHub has some useful troubleshooting tips here: https://developer.github.com/v3/guides/using-ssh-agent-forwarding/#troubleshooting-ssh-agent-forwarding." >> /dev/stderr
    echo "When you think you've got things set up correctly, try running '${test_command}'." >> /dev/stderr
    exit 1
  fi
}

find_instance_by_name() {
  local __resultvar=$1
  local __instance_name=$2

  local __running_instances=`aws ec2 describe-instances | jq ".Reservations[] | .Instances[] | select(.State.Name == \"running\")"`
  local __instance_id=`echo "${__running_instances}" | jq --raw-output "select((.Tags[] | select(.Key == \"Name\") | .Value) == \"${__instance_name}\") | .InstanceId"`
  local __instances_count=`count_lines "${__instance_id}"`
  if [ "${__instances_count}" != "1" ]; then
    echo "Found ${__instances_count} running instances named ${__instance_name}, when I expected to find exactly 1." >> /dev/stderr
    echo "I'm giving up now." >> /dev/stderr
    exit 1
  fi
  eval $__resultvar="'$__instance_id'"
}

get_instance_domain_name() {
  local __resultvar=$1
  local __instance_id=$2

  local __domain_name=`aws ec2 describe-instances --instance-ids ${__instance_id} | jq --raw-output ".Reservations[0].Instances[0].PublicDnsName"`
  eval $__resultvar="'${__domain_name}'"
}

get_instance_internal_ip_address() {
  local __resultvar=$1
  local instance_id=$2

  local __ip_address=`aws ec2 describe-instances --instance-ids ${instance_id} | jq --raw-output ".Reservations[0].Instances[0].NetworkInterfaces[0].PrivateIpAddresses[0].PrivateIpAddress"`
  eval $__resultvar="'${__ip_address}'"
}

get_pem_filename() {
  local __resultvar=$1
  local keyname=$2
  local __pem_filename=~/.ssh/${keyname}.pem
  if ! [ -e ${__pem_filename} ]; then
    echo "Could not find ${__pem_filename}, I won't be able to connect to any EC2 servers until that file exists." >> /dev/stderr
    exit 1
  fi

  eval $__resultvar="'${__pem_filename}'"
}

new() {
  print_command_usage_and_exit() {
    echo "Create a server with either a weak, standard or high instance type"
    echo "Usage: $0 new [--staging] [weak/standard/high] [keyname]" >> /dev/stderr
    echo "For example: $0 new high jfly-kaladin-arch" >> /dev/stderr
    echo "Or, to spin up a new staging server: $0 new --staging jfly-kaladin-arch" >> /dev/stderr

    echo "" >> /dev/stderr
    echo "Run 'aws ec2 describe-key-pairs' to see a list of valid key pairs." >> /dev/stderr
    echo "If you do not have one associated with our account yet, you'll need to create one." >> /dev/stderr
    echo "The directions here: http://docs.aws.amazon.com/cli/latest/userguide/cli-ec2-keypairs.html#creating-a-key-pair might help." >> /dev/stderr
    exit 1
  }
  staging=false
  if [[ "$1" =~ ^--.* ]]; then
    if [ "$1" != "--staging" ]; then
      echo "Unrecognized argument: $1, perhaps you meant '--staging'?" >> /dev/stderr
      echo "" >> /dev/stderr
      print_command_usage_and_exit
    fi
    staging=true
    shift
  fi
  if [ $# -ne 2 ]; then
    print_command_usage_and_exit
  fi

  case "$1" in
    weak)
      instance_type=t3.medium
      ;;
    standard)
      instance_type=t3.large
      ;;
    high)
      instance_type=m6i.large
      ;;
    *)
      echo "Unknown instance type"
      print_command_usage_and_exit
  esac
  shift

  keyname=$1
  shift

  check_deps
  if [ "$staging" = true ]; then
    temp_new_server_name=${TEMP_NEW_STAGING_SERVER_NAME}
    elastic_ip=STAGING_ELASTIC_IP
  else
    temp_new_server_name=${TEMP_NEW_PROD_SERVER_NAME}
    elastic_ip=PRODUCTION_ELASTIC_IP
  fi

  get_pem_filename pem_filename ${keyname}

  test_ssh_to_server ${elastic_ip}

  # Spin up a new EC2 instance.
  json=`aws ec2 run-instances \
    --image-id ami-03d5c68bab01f3496 \
    --count 1 \
    --key-name $keyname \
    --instance-type $instance_type \
    --security-groups "SSH + HTTP + HTTPS" \
    --iam-instance-profile "Name=prod_role" \
    --block-device-mappings '[ { "DeviceName": "/dev/sda1", "Ebs": { "DeleteOnTermination": true, "VolumeSize": 60, "VolumeType": "gp3" } } ]'`

  instance_id=`echo $json | jq --raw-output '.Instances[0].InstanceId'`
  aws ec2 create-tags --resources ${instance_id} --tags Key=Name,Value=${temp_new_server_name}
  echo "Allocated new server with instance id: $instance_id and named it ${temp_new_server_name}."

  echo -n "Waiting for ${temp_new_server_name} to finish initializing..."
  aws ec2 wait instance-status-ok --instance-ids ${instance_id}
  echo " done!"

  bootstrap ${keyname} ${temp_new_server_name}
}

bootstrap() {
  keyname=$1
  shift

  server_name=$1
  shift

  if [ "${server_name}" == "${TEMP_NEW_STAGING_SERVER_NAME}" ]; then
    environment=staging
    elastic_ip=STAGING_ELASTIC_IP
    next_cmd="$0 passthetorch --staging"
  elif [ "${server_name}" == "${TEMP_NEW_PROD_SERVER_NAME}" ]; then
    environment=production
    elastic_ip=PRODUCTION_ELASTIC_IP
    next_cmd="$0 passthetorch"
  else
    echo "Unrecognized server name '${server_name}'" >> /dev/stderr
    exit 1
  fi
  find_instance_by_name instance_id ${server_name}
  echo "Found instance '${server_name}' with id ${instance_id}!"

  get_pem_filename pem_filename ${keyname}
  get_instance_domain_name domain_name ${instance_id}
  echo "About to bootstrap instance id ${instance_id}. Its public dns name is ${domain_name}."

  ssh_command="ssh -i ${pem_filename} -o StrictHostKeyChecking=no -A ubuntu@${domain_name}"

  test_ssh_agent_forwarding "${ssh_command}" ${elastic_ip}

  echo "For debugging purposes, you can ssh to the server via '${ssh_command}'"
  echo "Bootstrapping the newly created server..."
  # See http://ubuntu-smoser.blogspot.com/2010/07/verify-ssh-keys-on-ec2-instances.html or
  # https://alestic.com/2012/04/ec2-ssh-host-key/ for better solutions than
  # setting StrictHostKeyChecking=no.
  scp -i ${pem_filename} -o StrictHostKeyChecking=no ./wca-bootstrap.sh ubuntu@${domain_name}:/tmp/wca-bootstrap.sh
  ${ssh_command} "sudo -E bash /tmp/wca-bootstrap.sh ${environment}"

  # After bootstrapping the new server, it will have a new host key. To avoid future errors like
  #
  #  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  #  @    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
  #  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  #
  # we remove the now invalid host key associated with this domain name.
  ssh-keygen -R ${domain_name}

  echo ""
  echo "Successfully spun up new server at ${domain_name}"
  echo "Run '$next_cmd' to test out the new server and possibly switchover to it."
}

list_instances() {
  print_command_usage_and_exit() {
    echo "Usage: $0 list-instances" >> /dev/stderr
    exit 1
  }
  if [ $# -ne 0 ]; then
    print_command_usage_and_exit
  fi

  check_deps

  aws ec2 describe-instances | jq --raw-output '.Reservations[] | .Instances[] | "InstanceId: \(.InstanceId)     Name: \(.Tags[] | select(.Key == "Name") | .Value)"'
}

function addhostfile() {
  find_instance_by_name new_server_id ${TEMP_NEW_PROD_SERVER_NAME}
  get_instance_domain_name domain_name ${new_server_id}
  local ip_address=`dig +short ${domain_name}`
  echo "Found instance '${TEMP_NEW_PROD_SERVER_NAME}' with id ${new_server_id} at ${domain_name} (${ip_address})!"
  if grep " worldcubeassociation.org " /etc/hosts > /dev/null; then
    echo "" >> /dev/stderr
    echo "Already found an entry in /etc/hosts for worldcubeassociation.org." >> /dev/stderr
    echo "You can remove it by running '$0 hostsfile remove'." >> /dev/stderr
    exit 1
  fi
  sudo cp /etc/hosts /etc/hosts.old
  sudo bash -c "echo '${ip_address} worldcubeassociation.org www.worldcubeassociation.org' >> /etc/hosts"
  echo "Backed up /etc/hosts to /etc/hosts.old and added entry for worldcubeassociation.org."
}

function removehostsfile() {
  sudo cp /etc/hosts /etc/hosts.old
  sudo sed -i "/ worldcubeassociation.org /d" /etc/hosts
  echo "Backed up /etc/hosts to /etc/hosts.old and removed entry for worldcubeassociation.org."
}

function hostsfile() {
  print_command_usage_and_exit() {
    echo "Usage: $0 hostsfile [add|remove]" >> /dev/stderr
    echo "$0 hostsfile add - This command will add an entry to /etc/hosts for a newly created server so you can test it out." >> /dev/stderr
    echo "$0 hostsfile remove - This command will remove the entry in /etc/hosts that 'hostsfile add' created." >> /dev/stderr
    exit 1
  }
  if [ $# -ne 1 ]; then
    print_command_usage_and_exit
  fi

  subcommand=$1
  shift

  check_deps

  if [ "$subcommand" == "add" ]; then
    addhostfile
  elif [ "$subcommand" == "remove" ]; then
    removehostsfile
  fi
}

wait_for_confirmation() {
  user_confirmation_str=$0
  confirmation_str="HOLD ONTO YOUR BUTTS"
  while [ "${user_confirmation_str}" != "${confirmation_str}" ]; do
    echo "Please type \"${confirmation_str}\" and press enter before proceeding."
    echo -n "> "
    read user_confirmation_str
  done
}

function passthetorch() {
  print_command_usage_and_exit() {
    echo "Usage: $0 passthetorch [--staging]" >> /dev/stderr
    echo "For example: $0 passthetorch" >> /dev/stderr
    exit 1
  }
  staging=false
  if [[ "$1" =~ ^--.* ]]; then
    if [ "$1" != "--staging" ]; then
      echo "Unrecognized argument: $1, perhaps you meant '--staging'?" >> /dev/stderr
      echo "" >> /dev/stderr
      print_command_usage_and_exit
    fi
    staging=true
    shift
  fi
  if [ $# -ne 0 ]; then
    print_command_usage_and_exit
  fi

  check_deps

  if [ "$staging" == "true" ]; then
    temp_new_server_name=$TEMP_NEW_STAGING_SERVER_NAME
    curr_server_name=$STAGING_SERVER_NAME
    old_server_name=$OLD_STAGING_SERVER_NAME
    elastic_ip=$STAGING_ELASTIC_IP
    next_cmd="$0 reap-servers --staging"
  else
    temp_new_server_name=$TEMP_NEW_PROD_SERVER_NAME
    curr_server_name=$PRODUCTION_SERVER_NAME
    old_server_name=$OLD_PRODUCTION_SERVER_NAME
    elastic_ip=$PRODUCTION_ELASTIC_IP
    next_cmd="$0 reap-servers"
  fi


  find_instance_by_name new_server_id $temp_new_server_name
  echo "Found instance '${temp_new_server_name}' with id ${new_server_id}!"

  find_instance_by_name curr_instance_id ${curr_server_name}
  echo "Found instance '${curr_server_name}' with id ${curr_instance_id}!"

  get_instance_domain_name domain_name ${new_server_id}
  ssh_command="ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=no -A cubing@${domain_name}"
  test_ssh_agent_forwarding "${ssh_command}" ${elastic_ip}

  # Register the new instance with the ELB
  echo "Registering Targets"
  if [ "$staging" = true ]; then
    aws elbv2 register-targets --target-group-arn ${STAGING_TARGET_GROUP} --targets Id=${new_server_id}
  else
    aws elbv2 register-targets --target-group-arn ${PROD_TARGET_GROUP} --targets Id=${new_server_id}
  fi 

  # Testing if the server works via the ELB Health Check.
  echo "Testing Targets"
  exit_code=0
  if [ "$staging" = true ]; then
    aws elbv2 wait target-in-service --target-group-arn ${STAGING_TARGET_GROUP} --targets Id=${new_server_id} || exit_code=$?
  else
    aws elbv2 wait target-in-service --target-group-arn ${PROD_TARGET_GROUP} --targets Id=${new_server_id} || exit_code=$?
  fi
  if [ $exit_code -ne 0 ]; then
    echo "Target registering failed with exit code: $exit_code"
    exit 1
  fi

  echo "The new server with instance_id ${instance_id} appears to be working."
  echo "We're almost ready to assign it the elastic ip address ${elastic_ip}"

  # The contents of the secrets directory on the live production server may
  # have changed since the user spun up this new server. Rsync it.
  ${ssh_command} "sudo -E rsync -az -e 'ssh -o StrictHostKeyChecking=no' --info=progress2 cubing@${elastic_ip}:/home/cubing/worldcubeassociation.org/secrets/ /home/cubing/worldcubeassociation.org/secrets"

  # Disable cron job running on the old server, to prevent it from operating
  # on the remote database (the same for both old and new server).
  old_ssh_command="ssh -o PasswordAuthentication=no -o StrictHostKeyChecking=no cubing@${elastic_ip}"
  ${old_ssh_command} 'crontab -l | sed -e "s/^/#/" -e "1i# Cronjobs disabled on `date` by servers.sh" | crontab'

  aws ec2 associate-address --public-ip ${elastic_ip} --instance-id ${new_server_id}
  echo ""
  echo "The new server with id ${new_server_id} is now live with the elastic ip ${elastic_ip}!"

  aws ec2 create-tags --resources ${curr_instance_id} --tags Key=Name,Value=${old_server_name}
  echo "Renamed server ${curr_instance_id} to ${old_server_name}."

  aws ec2 create-tags --resources ${new_server_id} --tags Key=Name,Value=${curr_server_name}
  echo "Renamed server ${new_server_id} to ${curr_server_name}."

  echo "Don't forget to terminate the old server named ${old_server_name}!"
  echo "You can do this by running '$next_cmd'."
}

reap_servers() {
  print_command_usage_and_exit() {
    echo "Usage: $0 reap-servers [--staging]" >> /dev/stderr
    echo "Terminates any old EC2 instances named '${OLD_PRODUCTION_SERVER_NAME}' or '${OLD_STAGING_SERVER_NAME}."
    echo "Meant to be run sometime after 'passthetorch'."
    exit 1
  }
  staging=false
  if [[ "$1" =~ ^--.* ]]; then
    if [ "$1" != "--staging" ]; then
      echo "Unrecognized argument: $1, perhaps you meant '--staging'?" >> /dev/stderr
      echo "" >> /dev/stderr
      print_command_usage_and_exit
    fi
    staging=true
    shift
  fi
  if [ $# -ne 0 ]; then
    print_command_usage_and_exit
  fi

  check_deps

  if [ "$staging" == "true" ]; then
    old_server_name=${OLD_STAGING_SERVER_NAME}
  else
    old_server_name=${OLD_PRODUCTION_SERVER_NAME}
  fi


  find_instance_by_name old_production_id ${old_server_name}
  echo "Found instance '${old_server_name}' with id ${old_production_id}!"

  echo "Deregistering the old Instances"
  if [ "$staging" = true ]; then
    aws elbv2 deregister-targets --target-group-arn ${STAGING_TARGET_GROUP} --targets Id=${new_server_id}
    aws elbv2 wait target-deregistered --target-group-arn ${STAGING_TARGET_GROUP} --targets Id=${new_server_id}
  else
    aws elbv2 deregister-targets --target-group-arn ${PROD_TARGET_GROUP} --targets Id=${new_server_id}
    aws elbv2 wait target-deregistered --target-group-arn ${PROD_TARGET_GROUP} --targets Id=${new_server_id}
  fi
  echo "Instance Derigistered"

  echo "I am going to terminate ${old_production_id}"
  wait_for_confirmation "HOLD ONTO YOUR BUTTS"

  aws ec2 terminate-instances --instance-ids ${old_production_id}
  echo ""
  echo "Successfully terminated ${old_server_name}"
}

# Copied from https://stackoverflow.com/a/17841619
function join_by { local IFS="$1"; shift; echo "$*"; }

# Copied from https://stackoverflow.com/a/8574392
containsElement() {
  local e match="$1"
  shift
  for e; do [[ "$e" == "$match" ]] && return 0; done
  return 1
}

assert_eq() {
  if [ "$1" != "$2" ]; then
    echo "Expected '$1' to equal '$2'." >> /dev/stderr
    exit 1
  fi
}

# Inspired by https://stackoverflow.com/a/16533786
count_lines() {
  echo -n "$1" | awk 'END{print NR}'
}
assert_eq `count_lines ''` "0"
assert_eq `count_lines 'foo'` "1"
assert_eq `count_lines $'foo\n'` "1"
assert_eq `count_lines $'foo\nbar'` "2"
assert_eq `count_lines $'foo\nbar\n'` "2"

COMMANDS=(new passthetorch hostsfile reap-servers list-instances)
JOINED_COMMANDS=`join_by "|" "${COMMANDS[@]}"`
print_usage_and_exit() {
  echo "Usage: $0 [$JOINED_COMMANDS]" >> /dev/stderr
  exit 1
}
if [ $# -eq 0 ]; then
  print_usage_and_exit
fi

COMMAND=$1
shift
if ! containsElement "$COMMAND" "${COMMANDS[@]}"; then
  echo "Unrecognized command: $COMMAND" >> /dev/stderr
  print_usage_and_exit
fi

if [ "$COMMAND" == "new" ]; then
  new "$@"
elif [ "$COMMAND" == "passthetorch" ]; then
  passthetorch "$@"
elif [ "$COMMAND" == "reap-servers" ]; then
  reap_servers "$@"
elif [ "$COMMAND" == "hostsfile" ]; then
  hostsfile "$@"
elif [ "$COMMAND" == "list-instances" ]; then
  list_instances "$@"
fi
