#!/usr/bin/env bash

cd "$(dirname "$0")"/..

# The export_public script only will do an actual export if it sees the
# export url paramter.
time (cd webroot/results/admin/; REQUEST_URI="export=" php export_public.php)
