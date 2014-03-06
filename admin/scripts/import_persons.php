<?php

include "../../includes/_framework.php";

$compId = getNormalParam('c');

// Fill in any missing person data

// get person data
$persons = $wcadb_conn->boundQuery(
    "SELECT p.*, YEAR(p.dob) AS year, MONTH(p.dob) AS month, DAY(p.dob) AS day, c.id AS country
     FROM InboxPersons as p
     LEFT JOIN Countries AS c ON (p.countryId = c.iso2)
     WHERE competitionId = ?"
    , array('s', &$compId)
  );

// update any missing genders
foreach($persons as $person) {
  $query = "UPDATE Persons SET gender = ?
            WHERE gender = '' AND name = ? AND countryId = ? AND subId = 1
            AND id IN (SELECT DISTINCT personId FROM Results WHERE competitionId = ?)
            LIMIT 1";

  $wcadb_conn->boundCommand($query,
      array('ssss', &$person['gender'], &$person['name'], &$person['country'], &$compId)
    );
}

// update any missing DOBs
foreach($persons as $person) {
  $query = "UPDATE Persons SET year = ?, month = ?, day = ?
            WHERE year = 0 AND name = ? AND countryId = ? AND subId = 1
            AND id IN (SELECT DISTINCT personId FROM Results WHERE competitionId = ?)
            LIMIT 1";

  $wcadb_conn->boundCommand($query,
      array('iiisss', &$person['year'], &$person['month'], &$person['day'], &$person['name'], &$person['country'], &$compId)
    );
}

// delete temp persons
$query = "DELETE FROM InboxPersons WHERE competitionId = ?";
$wcadb_conn->boundCommand($query, array('s', &$compId));


print "Imported Persons...";
