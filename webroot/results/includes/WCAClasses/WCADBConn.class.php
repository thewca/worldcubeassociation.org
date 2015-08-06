<?php
/* @file
 * 
 * This file implements logic to create a basic mysqli connection, and implements a couple other functions contained
 * in the _database.php include file.  Currently most of the results system relies on mysql functionality, which will
 * soon be deprecated.
 * 
 * Please help improve this class!  Extending functionality here can help us implement a maintainable codebase.
 * 
 */
namespace WCAClasses;

/*
 * @var wcaDBConn
 * Extends DBConn, and implements some WCA result system-specific functionality.
 */
class wcaDBConn extends DBConn
{

    public function getCompetitionValue($id, $valueName)
    {
        $id = $this->mysqlEscape($id);
        $valueName = $this->mysqlEscape($valueName);

        $tmp = $this->dbQuery( "SELECT {$valueName} AS value FROM Competitions WHERE id='{$id}'" );
        $tmp = $tmp[0];
        return $tmp->value;
    }

    // Return mysql result object with all competition data, or FALSE if unique competition doesn't exist.
    public function getFullCompetitionInfos($id)
    {
        $id = $this->mysqlEscape($id);

        $results = $this->dbQuery("SELECT * FROM Competitions WHERE id='{$id}'");
        if(count($results) != 1)
        {
            return FALSE;
        }
        return $results[0];
    }

}

/**

SOME OLD CODE HERE, FOR REFERENCE.

The above function should contain all functionality in the old _database.php file, except functions below.  Need to make a class out of this or something?

Should really find a better way to cache dynamic common data, rather than just including static array data as a global.  But why cache at all?  Seems like this is
going a bit overboard.  It shouldn't be much of a performance hit to just query this, since individual pages are cached anyways, and reading these in from MySQL
shouldn't actually take that long.

**/

/**
Stuff cached in physical files
#----------------------------------------------------------------------
function getAllEvents () {
#----------------------------------------------------------------------
  global $cachedEvents;
  return $cachedEvents;
}

#----------------------------------------------------------------------
function getAllRounds () {
#----------------------------------------------------------------------
  global $cachedRounds;
  return $cachedRounds;
}

#----------------------------------------------------------------------
function getAllCompetitions () {
#----------------------------------------------------------------------
  global $cachedCompetitions;
  return $cachedCompetitions;
}

#----------------------------------------------------------------------
function getAllUsedCountries () {
#----------------------------------------------------------------------
  global $cachedUsedCountries;
  return $cachedUsedCountries;
}

#----------------------------------------------------------------------
function getAllUsedCountriesCompetitions () {
#----------------------------------------------------------------------
  global $cachedUsedCountriesCompetitions;
  return $cachedUsedCountriesCompetitions;
}

#----------------------------------------------------------------------
function getAllUsedContinents () {
#----------------------------------------------------------------------
  global $cachedUsedContinents;
  return $cachedUsedContinents;
}

#----------------------------------------------------------------------
function getAllUsedYears () {
#----------------------------------------------------------------------
  global $cachedUsedYears;
  return $cachedUsedYears;
}

#----------------------------------------------------------------------
function getAllIDs ( $rows ) {
#----------------------------------------------------------------------
  foreach ( $rows as $row )
    $ids[] = $row['id'];
  return $ids;
}

function getAllEventIds                    () { return getAllIDs( getAllEvents()                    ); }
function getAllRoundIds                    () { return getAllIDs( getAllRounds()                    ); }
function getAllCompetitionIds              () { return getAllIDs( getAllCompetitions()              ); }
function getAllUsedCountriesIds            () { return getAllIDs( getAllUsedCountries()             ); }
function getAllUsedCountriesCompetitionIds () { return getAllIDs( getAllUsedCountriesCompetitions() ); }
function getAllUsedContinentIds            () { return getAllIDs( getAllUsedContinents()            ); }

function getAllEventIdsIncludingObsolete () {
  return getAllIDs(dbQuery("SELECT id FROM Events WHERE rank<1000 ORDER BY rank"));
}
**/

/**
Wtf is this
#----------------------------------------------------------------------
function structureBy ( $results, $field ) {
#----------------------------------------------------------------------

  $allParts = array();
  foreach( $results as $result ){
    if( !isset($current) || $result[$field] != $current ){
      $current = $result[$field];
      if( isset( $thisPart ))
        $allParts[] = $thisPart;
      $thisPart = array();
    }
    $thisPart[] = $result;
  }
  if( isset( $thisPart ))
    $allParts[] = $thisPart;

  return $allParts;
}
**/
