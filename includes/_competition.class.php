<?php
/* @file
 * 
 * This file contains a class which can be used for storing/accessing competition data.
 * 
 */

/*
 * @var competitionData
 * A class containing information relevant to a competition.  For now, this is really just
 * the data contained in the Competitions table about the competition.  Use of this class
 * depends on functionality in the _database.php include file - a connection is expected.
 *
 * Available methods:
 *  - get($val): returns a data value from the competition.  Returns a boolean FALSE upon
 *    failure - use "identical" comparison operators to check for failed returns.
 *  - load($competitionId): (re-)load another competition.
 *
 */
class competitionData
{

    // For now, data is just an array containing competition information.
    // We probably eventually want a true object that can be imported/exported as JSON.
    protected $data = NULL;
    protected $dbconn = NULL;

    public function __construct($competitionId, $dbconn)
    {
        // do a bit of connection validation here...
        if(is_object($dbconn) && method_exists($dbconn, "dbQuery") && $dbconn->conn->stat())
        {
            // Great! We seem to be connected.
        }
        else
        {
            trigger_error("Unable to use database connection!", E_USER_ERROR);
        }

        $this->dbconn = $dbconn;
        $this->load($competitionId);
    }

    public function load($id)
    {
        $id = $this->dbconn->mysqlEscape($id);
        $competition_data = $this->dbconn->dbQuery("SELECT * FROM Competitions WHERE id='{$id}'");

        if(count($competition_data) != 1)
        {
            trigger_error("Unable to load - unique competition not found!", E_USER_ERROR);
        }

        $this->data = get_object_vars($competition_data[0]);

        return $this;
    }

    public function get($value)
    {
        return $this->data[$value];
    }

}
