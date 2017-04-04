<?php

$currentSection = 'admin';
include "../../includes/_framework.php";

$compId = getNormalParam('c');
$eventId = getNormalParam('e');
$roundTypeId = getNormalParam('r');
$table = getNormalParam('t');

if($table == "Scrambles") {
  $deleted = $wcadb_conn->boundCommand(
     "DELETE FROM Scrambles WHERE competitionId=? AND eventId=? AND roundTypeId=?",
      array('sss', &$compId, &$eventId, &$roundTypeId)
    );
}

if($table == "Results") {
  $deleted = $wcadb_conn->boundCommand(
     "DELETE FROM Results WHERE competitionId=? AND eventId=? AND roundTypeId=?",
      array('sss', &$compId, &$eventId, &$roundTypeId)
    );  
}

if($table == "All") {
  $deleted = $wcadb_conn->boundCommand(
     "DELETE FROM Results WHERE competitionId=?",
      array('s', &$compId)
    );
  $deleted = $wcadb_conn->boundCommand(
     "DELETE FROM Scrambles WHERE competitionId=?",
      array('s', &$compId)
    );
}

print '<span style="color:#A00;"><strong>Removed.</strong></span>';
