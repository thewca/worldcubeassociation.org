#!/usr/bin/env bash

set -e

PRODUCTION_SERVER_NAME="worldcubeassociation.org"
TEMP_NEW_SERVER_NAME="temp-new-server-via-cli"
ELASTIC_IP="34.208.140.116"

test_ssh_to_production() {
  local test_command='ssh -o PasswordAuthentication=no cubing@worldcubeassociation.org echo Successfulness'
  local connected_str=`${test_command} || true`
  if [ "${connected_str}" != "Successfulness" ]; then
    echo "" >> /dev/stderr
    echo "Unable to connect to the current production server." >> /dev/stderr
    echo "You need to set up passwordless ssh to production locally before spinning up a new server." >> /dev/stderr
    echo "If you do not know how to do this, look into ssh-copy-id." >> /dev/stderr
    echo "When you think you've got things set up correctly, try running '${test_command}'." >> /dev/stderr
    exit 1
  fi
}

test_ssh_agent_forwarding() {
  local ssh_command=$1

  local test_command="${ssh_command} echo Successfulness"
  local connected_str=`${test_command} || true`
  if [ "${connected_str}" != "Successfulness" ]; then
    echo "" >> /dev/stderr
    echo "Unable to connect to the new server." >> /dev/stderr
    echo "When you think you've got things set up correctly, try running '${test_command}'." >> /dev/stderr
    exit 1
  fi

  local test_command="${ssh_command} ssh -o PasswordAuthentication=no -o StrictHostKeyChecking=no cubing@worldcubeassociation.org echo Successfulness"
  local connected_str=`${test_command} || true`
  if [ "${connected_str}" != "Successfulness" ]; then
    echo "" >> /dev/stderr
    echo "Unable to connect to the current production server through the newly created server." >> /dev/stderr
    echo "This is indicative of a problem with your ssh agent forwarding. GitHub has some useful troubleshooting tips here: https://developer.github.com/v3/guides/using-ssh-agent-forwarding/#troubleshooting-ssh-agent-forwarding." >> /dev/stderr
    echo "When you think you've got things set up correctly, try running '${test_command}'." >> /dev/stderr
    exit 1
  fi
}

get_instance_domain_name() {
  local  __resultvar=$1
  local instance_id=$2

  local __domain_name=`aws ec2 describe-instances --instance-ids ${instance_id} | jq --raw-output ".Reservations[0].Instances[0].PublicDnsName"`
  eval $__resultvar="'${__domain_name}'"
}

get_instance_internal_ip_address() {
  local  __resultvar=$1
  local instance_id=$2

  local __ip_address=`aws ec2 describe-instances --instance-ids ${instance_id} | jq --raw-output ".Reservations[0].Instances[0].NetworkInterfaces[0].PrivateIpAddresses[0].PrivateIpAddress"`
  eval $__resultvar="'${__ip_address}'"
}

new() {
  print_command_usage_and_exit() {
    echo "Usage: $0 new [keyname]" >> /dev/stderr
    echo "For example: $0 new jfly-kaladin-arch" >> /dev/stderr

    echo "" >> /dev/stderr
    echo "Run 'aws ec2 describe-key-pairs' to see a list of valid key pairs." >> /dev/stderr
    echo "If you do not have one associated with our account yet, you'll need to create one." >> /dev/stderr
    echo "The directions here: http://docs.aws.amazon.com/cli/latest/userguide/cli-ec2-keypairs.html#creating-a-key-pair might help." >> /dev/stderr
    exit 1
  }
  if [ $# -ne 1 ]; then
    print_command_usage_and_exit
  fi

  keyname=$1
  shift

  pem_filename=~/.ssh/${keyname}.pem
  if ! [ -e $pem_filename ]; then
    echo "" >> /dev/stderr
    echo "Could not find ${pem_filename}, I won't be able to connect to any EC2 servers until that file exists." >> /dev/stderr
    exit 1
  fi

  test_ssh_to_production

  # Spin up a new EC2 instance.
  json=`aws ec2 run-instances \
    --image-id ami-7c22b41c \
    --count 1 \
    --instance-type t2.medium \
    --key-name $keyname \
    --security-groups "allow all incoming" \
    --block-device-mappings '[ { "DeviceName": "/dev/sda1", "Ebs": { "DeleteOnTermination": true, "VolumeSize": 32, "VolumeType": "standard" } } ]'`

  instance_id=`echo $json | jq --raw-output '.Instances[0].InstanceId'`

  get_instance_domain_name domain_name ${instance_id}

  json=`aws ec2 create-tags --resources ${instance_id} --tags Key=Name,Value=${TEMP_NEW_SERVER_NAME}`
  echo "Allocated new server with instance id: $instance_id and named it ${TEMP_NEW_SERVER_NAME}."
  echo "Its public dns name is ${domain_name}."

  echo -n "Waiting for ${TEMP_NEW_SERVER_NAME} to finish initializing..."
  aws ec2 wait instance-status-ok --instance-ids ${instance_id}
  echo " done!"

  ssh_command="ssh -i ${pem_filename} -o StrictHostKeyChecking=no -A ubuntu@${domain_name}"

  test_ssh_agent_forwarding "${ssh_command}"

  echo "For debugging purposes, you can ssh to the server via '${ssh_command}'"
  echo "Bootstrapping the newly created server..."
  # See http://ubuntu-smoser.blogspot.com/2010/07/verify-ssh-keys-on-ec2-instances.html or
  # https://alestic.com/2012/04/ec2-ssh-host-key/ for better solutions than
  # setting StrictHostKeyChecking=no.
  ${ssh_command} -A 'sudo wget https://raw.githubusercontent.com/thewca/worldcubeassociation.org/master/scripts/wca-bootstrap.sh -O /tmp/wca-bootstrap.sh && sudo -E bash /tmp/wca-bootstrap.sh production'

  # After bootstrapping the new server, it will have a new host key. To avoid future errors like
  #
  #  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  #  @    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
  #  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  #
  # we remove the now invalid host key associated with this domain name.
  ssh-keygen -R ${domain_name}
}

function passthetorch() {
  print_command_usage_and_exit() {
    echo "Usage: $0 passthetorch" >> /dev/stderr
    echo "For example: $0 passthetorch" >> /dev/stderr
    exit 1
  }
  if [ $# -ne 0 ]; then
    print_command_usage_and_exit
  fi

  find_instance_by_name() {
    local  __resultvar=$1
    local instance_name=$2

    local running_instances=`aws ec2 describe-instances | jq ".Reservations[] | .Instances[] | select(.State.Name == \"running\")"`
    local instance_id=`echo "${running_instances}" | jq --raw-output "select((.Tags[] | select(.Key == \"Name\") | .Value) == \"${instance_name}\") | .InstanceId"`
    local instances_count=`count_lines "${instance_id}"`
    if [ "${instances_count}" != "1" ]; then
      echo "Found ${instances_count} running instances named ${instance_name}, when I expected to find exactly 1." >> /dev/stderr
      echo "I'm giving up now." >> /dev/stderr
      exit 1
    fi
    eval $__resultvar="'$instance_id'"
  }

  find_instance_by_name production_instance_id ${PRODUCTION_SERVER_NAME}
  echo "Found instance '${PRODUCTION_SERVER_NAME}' with id ${production_instance_id}!"

  find_instance_by_name new_server_id ${TEMP_NEW_SERVER_NAME}
  echo "Found instance '${TEMP_NEW_SERVER_NAME}' with id ${new_server_id}!"

  get_instance_domain_name domain_name ${new_server_id}
  echo "Testing out new server at ${domain_name}"

  # Do a quick smoke test of the new server.
  local ip_address=`dig +short ${domain_name}`
  curl_cmd="curl --write-out %{http_code} --silent --resolve www.worldcubeassociation.org:443:${ip_address} https://www.worldcubeassociation.org/server-status"
  curl_result=`${curl_cmd}`

  ip_addresses=`echo "$curl_result" | grep -o "IP Addresses: [^ <]\+"`
  get_instance_internal_ip_address expected_ip ${new_server_id}
  if ! echo $ip_addresses | grep ${expected_ip} > /dev/null; then
    echo "" >> /dev/stderr
    echo "When visiting https://www.worldcubeassociation.org/server-status via server ${ip_address}, we expected to see internal IP address ${expected_ip}, but instead found ${ip_addresses}" >> /dev/stderr
    exit 1
  fi

  server_status=`echo "$curl_result" | tail -1`
  if [ "${server_status}" != "200" ]; then
    echo "" >> /dev/stderr
    echo "https://www.worldcubeassociation.org/server-status returned non 200 status code: ${server_status}" >> /dev/stderr
    echo "You can test this out by running: ${curl_cmd}" >> /dev/stderr
    exit 1
  fi

  echo "The new server at ${domain_name} appears to be working."
  echo "We're ready to assign it the elastic ip address ${ELASTIC_IP}"

  user_confirmation_str=""
  confirmation_str="HOLD ONTO YOUR BUTTS"
  while [ "${user_confirmation_str}" != "${confirmation_str}" ]; do
    echo "Please type \"${confirmation_str}\" and press enter before proceeding."
    echo -n "> "
    read user_confirmation_str
  done

  aws ec2 associate-address --public-ip ${ELASTIC_IP} --instance-id ${new_server_id}
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

COMMANDS=(new passthetorch)
JOINED_COMMANDS=`join_by "|" "${COMMANDS[@]}"`
print_usage_and_exit() {
  echo "Usage: $0 [$JOINED_COMMANDS]" >> /dev/stderr
  exit 1
}
if [ $# -eq 0 ]; then
  print_usage_and_exit
fi

COMMAND=$1
if ! containsElement "$COMMAND" "${COMMANDS[@]}"; then
  echo "Unrecognized command: $COMMAND" >> /dev/stderr
  print_usage_and_exit
fi
shift

if [ "$COMMAND" == "new" ]; then
  new "$@"
elif [ "$COMMAND" == "passthetorch" ]; then
  passthetorch "$@"
fi
