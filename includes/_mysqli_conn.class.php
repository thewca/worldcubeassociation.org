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


/*
 * @var DBConn
 * A class used to connect to the results database, perform basic validation, make calls, etc.
 * Results system benchmarking isn't currently reliable, so let's not implement it here yet.
 */
class DBConn
{
    public $conn;
    private $debug = FALSE;

    public function __construct($config, $charset = "utf8")
    {
        $this->conn = new mysqli($config['host'], $config['user'], $config['pass'], $config['name']);
        if($this->conn->connect_errno)
        {
            trigger_error("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error, E_USER_ERROR);
        }

        /* change character set */
        if(!$this->conn->set_charset($charset))
        {
            printf("Error loading character set {$charset}: %s\n", $this->conn->error);
        }
    }

    public function setDebug($val)
    {
        $this->debug = $val ? TRUE : FALSE;
        return $this;
    }

    // kill script, display error message.
    public function showDatabaseError($message)
    {
        // Normal users just get a "Sorry", developers/debuggers get more details
        if($_SERVER['SERVER_NAME'] == 'localhost'  ||  $this->debug){
            die("<p>$message<br />\n(" . mysql_error() . ")</p>\n");
        }
        else
        {
            die("<p>Uh-oh!  There was a problem with the database. Please try again later, and contact the website administrator if this message persists.</p>");
        }
    }

    public function mysqlEscape($val)
    {
        if($val === "")
        {
            return "";
        }
        elseif(is_numeric($val))
        {
            return $val;
        }
        elseif(is_string($val))
        {
            return $this->conn->real_escape_string($val);
        }
        else
        {
            $this->showDatabaseError("Error attempting to escape mysql data!");
        }
    }

    // return an array of result objects.
    public function dbQuery($query)
    {

        if($this->debug){
            global $dbQueryCtr;
            $dbQueryCtr++;
            $this->printCommand($query);
        }

        $result = $this->conn->query($query);
        if($this->conn->error)
        {
            $this->showDatabaseError("Unable to perform database query!");
        }

        $rows = array();
        while ($row = $result->fetch_object())
        {
            $rows[] = $row;
        }

        $result->close();

        return $rows;
    }

    // just run a query, don't need to process return values.
    public function dbCommand($command)
    {

        // print command if in debug mode
        if($this->debug){
            global $dbCommandCtr;
            $dbCommandCtr++;
            $this->printCommand($command);
        }

        $result = $this->conn->query($command);

        if($this->conn->error)
        {
            $this->showDatabaseError("Unable to execute database command!");
        }

        return $this;
    }

    function dbDebug($query)
    {
        echo "<table border='1'>";
        foreach($this->dbQuery($query) as $result)
        {
            echo "<tr>";
            foreach(get_object_vars($result) as $property => $value)
            {
                echo "<td>" . htmlEntities($value) . "</td>"; 
            }
            echo "</tr>";
        }
        echo "</table>";
    }

    public function printCommand($command)
    {
            if(strlen($command) < 1010)
            {
                $commandForShow =  $command;
            }
            else
            {
                $commandForShow =  substr($command,0,1000) . '[...' . (strlen($command)-1000) . '...]';;
            }
            echo "\n\n<!-- \n{$commandForShow}\n -->\n\n";

            return $this;
    }

}

/*
 * @var wcaDBConn
 * Extends DBConn, and implements some WCA result system-specific functionality.
 */
class wcaDBConn extends DBConn
{

    public function getCompetitionPassword($id, $admin)
    {

        $id = $this->mysqlEscape($id);

        if($admin)
        {
            $tmp = $this->dbQuery("SELECT adminPassword password FROM Competitions WHERE id='{$id}'");
        }
        else
        {
            $tmp = $this->dbQuery("SELECT organiserPassword password FROM Competitions WHERE id='{$id}'");
        }
        if(isset($tmp[0]))
        {
            $tmp = $tmp[0];
        }
        else
        {
            $this->showDatabaseError("Unable to retrieve competition password!");
        }
        
        return $tmp->password;
    }

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
