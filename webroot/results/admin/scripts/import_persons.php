<?php

include "../../includes/_framework.php";

$compId = getNormalParam('c');

// Fill in any missing person data
// All are done in persons_finish_unfinished_ACTION.php
// See https://github.com/thewca/worldcubeassociation.org/issues/2286

// Check if any persons with numeric ID
$compId = mysqlEscape( $compId );
$unfinishedPersonsCount = dbValue("
  SELECT count(DISTINCT personId)
  FROM Results
  WHERE competitionId='$compId' AND personId REGEXP '^[0-9]+$'
");

if ($unfinishedPersonsCount != 0) {
  jsonReturn( 'ERROR', "There're $unfinishedPersonsCount newcomer(s) for this competition. Please run persons_finish_unfinished until it shows empty!" );
}


// delete temp persons
$query = "DELETE FROM InboxPersons WHERE competitionId = ?";
$wcadb_conn->boundCommand($query, array('s', &$compId));

jsonReturn();
