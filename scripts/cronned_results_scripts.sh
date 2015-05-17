#!/bin/bash

# cd to the directory of this script.
# From http://stackoverflow.com/a/1638397
# Absolute path to this script, e.g. /home/user/bin/foo.sh
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in, thus /home/user/bin
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH

# The export_public script only will do an actual export if it sees the
# export url paramter.
time (cd ../webroot/results/admin/; REQUEST_URI="export=" ./export_public.php)

# Update statistics page
(cd ../webroot/results/; rm generated/statistics.cache; time php statistics.php;)
