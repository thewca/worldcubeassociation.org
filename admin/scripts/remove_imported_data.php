<?php

include "../../includes/_framework.php";

$compId = getNormalParam('c');

$deleted = $wcadb_conn->boundCommand(
   "DELETE FROM InboxResults WHERE competitionId=?",
    array('s', &$compId)
  );
$deleted = $wcadb_conn->boundCommand(
   "DELETE FROM InboxPersons WHERE competitionId=?",
    array('s', &$compId)
  );
$deleted = $wcadb_conn->boundCommand(
   "DELETE FROM Scrambles WHERE competitionId=?",
    array('s', &$compId)
  );

print "Removal attempted.";
