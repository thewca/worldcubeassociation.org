#!/usr/bin/env bash
# Downloaded from https://raw.githubusercontent.com/FatBoyXPC/acces.sh/master/acces.sh

set -e

### Parsing command line arguments

function printHelpAndExit {
    echo "Usage: $0 actually print helpful info here"
    exit 0
}

if [ $# -eq 0 ]; then
    printHelpAndExit
fi

while [[ $# -gt 0 ]]; do
    key="$1"

    case $key in
        --gh-token)
            GH_TOKEN="$2"
            shift # past argument
        ;;
        --gh-team)
            GH_TEAM="$2"
            shift # past argument
        ;;
        --gh-org)
            GH_ORG="$2"
            shift # past argument
        ;;
        --keyfile)
            AUTHORIZED_KEYS_PATH="$2"
            shift # past argument
        ;;
        --help)
            printHelpAndExit
        ;;
        *)
            echo "Unrecognized option: $1"
            printHelpAndExit
        ;;
    esac
    shift
done

if [ -z "$AUTHORIZED_KEYS_PATH" ]; then
    dry_run=true
fi

teams_json=`curl -s -H "Authorization: token $GH_TOKEN" "https://api.github.com/orgs/$GH_ORG/teams"`
type_types_json=`echo $teams_json | jq -r 'type'`

if [ "$type_types_json" != "array" ]; then
    message=`echo $teams_json | jq -r ".message"`

    if [ "$message" == "Not Found" ]; then
        echo "GitHub organization '$GH_ORG' not found."
        exit 404
    fi

    if [ "$message" == "Bad credentials" ]; then
        echo "GH TOKEN $GH_TOKEN"
        echo "Could not authenticate with the GitHub API. Check your GH_TOKEN environment variable."
        exit 401
    fi

    if [ -n "$message" ]; then
        echo "Error occurred: $message"
        exit 1
    fi

    exit 1
fi

gh_team_id=`echo $teams_json | jq -r ".[] | select(.name==\"$GH_TEAM\").id"`

if [ -z "$gh_team_id" ]; then
    echo "Couldn't find '$GH_TEAM' in '$GH_ORG'"
    exit 1
fi

echo "Found GitHub team id '$gh_team_id' for '$GH_TEAM'"

users_json=`curl -s -H "Authorization: token $GH_TOKEN" "https://api.github.com/teams/$gh_team_id/members"`

users=`echo $users_json | jq -r '.[].login'`
tmp_authorized_keys_path=/tmp/authorized_keys

echo "Setting up ssh keys for members of the '$GH_TEAM' team of '$GH_ORG'."

for user in $users; do
    public_keys_url="https://github.com/$user.keys"

    echo "" >> $tmp_authorized_keys_path
    echo "# Keys for $user" >> $tmp_authorized_keys_path
    curl -s $public_keys_url >> $tmp_authorized_keys_path
done

if [ "$dry_run" = true ]; then
    echo "New authorized_keys file can be found at /tmp/authorized_keys"
    echo "Make sure to back up the old authorized_keys before replacing it:"
    echo "cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.bak"
    echo "mv /tmp/authorized_keys ~/.ssh/authorized_keys"
else
    mv $tmp_authorized_keys_path $AUTHORIZED_KEYS_PATH
    echo "$AUTHORIZED_KEYS_PATH has been updated."
fi
