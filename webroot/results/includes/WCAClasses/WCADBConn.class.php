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
