<?php

include "../../includes/_framework.php";

$compId = getNormalParam('c');

// Fill in any missing person data
// All are done in persons_finish_unfinished_ACTION.php
// See https://github.com/thewca/worldcubeassociation.org/issues/2286

// delete temp persons
$query = "DELETE FROM InboxPersons WHERE competitionId = ?";
$wcadb_conn->boundCommand($query, array('s', &$compId));


print "Imported Persons...";
