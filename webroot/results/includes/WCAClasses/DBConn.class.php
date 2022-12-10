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
 * @var DBConn
 * A class used to connect to the results database, perform basic validation, make calls, etc.
 * Results system benchmarking isn't currently reliable, so let's not implement it here yet.
 */
class DBConn
{
    public $conn; // so functionality can be used directly if needed
    private $debug = FALSE;

    public function __construct($config, $charset = "utf8")
    {
        $this->conn = new \mysqli($config['host'], $config['user'], $config['pass'], $config['name'], $config['port']);
        if($this->conn->connect_errno)
        {
            trigger_error("Failed to connect to MySQL: (" . $this->conn->connect_errno . ") " . $this->conn->connect_error, E_USER_ERROR);
        }

        // Treat warnings as errors
        $this->conn->query("SET SESSION sql_mode = 'TRADITIONAL';");

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
        // print command if in debug mode
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

    // just run a query, don't need to process return values
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


    // We can hopefully transition to using bound statements at some point
    function boundCommand($statement, $params /* array of references; first entry is type string */)
    {
        $statement = $this->conn->prepare($statement);
        call_user_func_array(array($statement,'bind_param'), $params);
        if(!$statement->execute()) {
            echo "execute failed: ";
            echo $statement->error;
            exit();
        }

        $statement->close();
        return;
    }

    // Use this to get results
    function boundQuery($statement, $params /* array of references */, $return_statement = FALSE)
    {
        // prepare, execute, then return either the statement or entire result set.
        $statement = $this->conn->prepare($statement);
        call_user_func_array(array($statement,'bind_param'), $params);
        if(!$statement->execute()) {
            echo "execute failed: ";
            echo $statement->error;
            exit();
        }
        if($return_statement) {
            return $statement;
        }
        $statement->store_result();
        $meta = $statement->result_metadata();

        // extract column names and bind to vars
        $cols = array();
        $data = array();
        while($column = $meta->fetch_field()) {
            $cols[] = &$data[$column->name];
        }
        call_user_func_array(array($statement, 'bind_result'), $cols);

        // amass results (less than ideal - return the statement if optimization needed)
        $array = array(); $i=0;
        while($statement->fetch())
        {
            $array[$i] = array();
            foreach($data as $k=>$v)
                $array[$i][$k] = $v;
            $i++;
        }

        $statement->close();
        return $array;
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
