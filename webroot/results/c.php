<?php

if (!isset($_REQUEST['competitionId'])) {
    $_REQUEST['competitionId'] = isset($_REQUEST['i']) ? $_REQUEST['i'] : "";
}

require_once('competition.php');
