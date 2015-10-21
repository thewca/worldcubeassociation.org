#!/usr/bin/env bash

cd "$(dirname "$0")"/..

# The export_public script only will do an actual export if it sees the
# export url paramter.
time (cd webroot/results/admin/; REQUEST_URI="export=" php export_public.php)

# Update statistics page
time (cd webroot/results/; rm -f generated/statistics.cache; php statistics.php)

# Update Evolution of Records
# We need to set SERVER_NAME to avoid generating the "This is only a copy of
# the WCA results system used for testing stuff" message.
time (cd webroot/results/misc/evolution; SERVER_NAME=www.worldcubeassociation.org php update7205.php)

# Update Missing Averages
time (cd webroot/results/misc/missing_averages; SERVER_NAME=www.worldcubeassociation.org php update7205.php)
