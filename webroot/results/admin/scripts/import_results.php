<?php

include "../../includes/_framework.php";

$compId = getNormalParam('c');

// move over results
$command = "INSERT INTO Results (pos,personId,personName,countryId,competitionId,eventId,roundTypeId,formatId,
                    value1,value2,value3,value4,value5,best,average)
          SELECT r.pos, p.wcaId, p.name, c.id, r.competitionId, r.eventId, r.roundTypeId, r.formatId, 
            r.value1, r.value2, r.value3, r.value4, r.value5, r.best, r.average
          FROM InboxResults as r
          LEFT JOIN InboxPersons as p
                  ON (p.id=r.personId AND r.competitionId=p.competitionId)
          LEFT JOIN Countries as c
                  ON (c.iso2=p.countryId)
          WHERE r.competitionId=?";
$wcadb_conn->boundCommand($command, array('s', &$compId));


// Set best-of-3 averages for bld (round times > 10:00)
$command = "UPDATE Results
            SET average = -1
              WHERE eventId = '333bf'
                AND average = 0
                AND formatId ='3'
                AND value1 != 0
                AND value2 != 0
                AND value3 != 0
                AND (value1<0 OR value2<0 OR value3<0)
                AND competitionId = ?";
$wcadb_conn->boundCommand($command, array('s', &$compId));

$command = "UPDATE Results
            SET average = IF( (value1+value2+value3)/3.0 > 60000, (value1+value2+value3)/3.0 - MOD((value1+value2+value3)/3.0,100), (value1+value2+value3)/3.0)
              WHERE eventId = '333bf'
                AND average = 0
                AND formatId ='3'
                AND value1 > 0
                AND value2 > 0
                AND value3 > 0
                AND competitionId = ?";
$wcadb_conn->boundCommand($command, array('s', &$compId));


// delete temp results
$command = "DELETE FROM InboxResults WHERE competitionId = ?";
$wcadb_conn->boundCommand($command, array('s', &$compId));

print "Imported Results...";
