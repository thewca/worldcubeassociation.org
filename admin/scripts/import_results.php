<?php

include "../../includes/_framework.php";

$compId = getNormalParam('c');

// move over results
$command = "INSERT INTO Results (pos,personId,personName,countryId,competitionId,eventId,roundId,formatId,
                    value1,value2,value3,value4,value5,best,average)
          SELECT r.pos, p.wcaId, p.name, c.id, r.competitionId, r.eventId, r.roundId, r.formatId, 
            r.value1, r.value2, r.value3, r.value4, r.value5, r.best, r.average
          FROM InboxResults as r
          LEFT JOIN InboxPersons as p
                  ON (p.id=r.personId AND r.competitionId=p.competitionId)
          LEFT JOIN Countries as c
                  ON (c.iso2=p.countryId)
          WHERE r.competitionId=?";
$wcadb_conn->boundCommand($command, array('s', &$compId));

// delete temp results
$command = "DELETE FROM InboxResults WHERE competitionId = ?";
$wcadb_conn->boundCommand($command, array('s', &$compId));

print "Imported Results...";
