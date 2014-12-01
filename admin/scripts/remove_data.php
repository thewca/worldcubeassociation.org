<?php

$currentSection = 'admin';
include "../../includes/_framework.php";

$compId = getNormalParam('c');
$eventId = getNormalParam('e');
$roundId = getNormalParam('r');
$table = getNormalParam('t');

if($table == "Scrambles") {
  $deleted = $wcadb_conn->boundCommand(
     "DELETE FROM Scrambles WHERE competitionId=? AND eventId=? AND roundId=?",
      array('sss', &$compId, &$eventId, &$roundId)
    );
}

if($table == "Results") {
  $deleted = $wcadb_conn->boundCommand(
     "DELETE FROM Results WHERE competitionId=? AND eventId=? AND roundId=?",
      array('sss', &$compId, &$eventId, &$roundId)
    );  
}

print "Removed.";
