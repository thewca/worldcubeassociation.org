<?php

include "../includes/_framework.php";

$compId = getNormalParam('c');
$eventId = getNormalParam('e');
$roundId = getNormalParam('r');

$deleted = $wcadb_conn->boundCommand(
   "DELETE FROM Scrambles WHERE competitionId=? AND eventId=? AND roundId=?",
    array('sss', &$compId, &$eventId, &$roundId)
  );

print "Removed.";
