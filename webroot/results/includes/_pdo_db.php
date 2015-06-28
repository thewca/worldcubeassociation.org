<?php

function pdo_query($query, $array = null)
{
    global $DBH;

    $sth = $DBH->prepare($query);
    if(!$sth)
        die("Could not prepare statement<br>\n" .
            "errorCode: " . $DBH->errorCode() . "<br>\n" .
            "errorInfo: " . join(", ", $DBH->errorInfo()));
    for($x=0;$x<count($array);$x++)
        $sth->bindParam($x+1, $array[$x],(is_int($array[$x]) ? PDO::PARAM_INT : PDO::PARAM_STR));
    if(!$sth->execute())
        die("Could not execute statement<br>\n" .
            "errorCode: " . $sth->errorCode() . "<br>\n" .
            "errorInfo: " . join(", ", $sth->errorInfo()));
    return $sth->fetchAll(PDO::FETCH_ASSOC);
}

function pdo_fetch_result(&$result)
{
    $row = current($result);
    next($result);
    return $row;
}

try
{
    $db_config = $config->get('database');
    $sql_dsn = "mysql:host=".$db_config['host'].";dbname=". $db_config['name'];

    // Ok, this is fun. We have some code in admin/competitions_manage.php that
    // dynamically requires _framework.php, who includes us (_pdo_db.php). Code
    // run in a PHP require() inherits the scope of the calling function.
    // pdo_query relies upon $DBH existing in the global scope, so we explicitly
    // declare $DBH to be global here. Thanks to this SO answer for putting
    // us on the right track:
    //  http://stackoverflow.com/a/4074833
    global $DBH;
    $DBH = new PDO($sql_dsn, $db_config['user'], $db_config['pass']);
}
catch(Exception $e)
{
	die("\r\n<br /><b>An error occurred trying to open a database connection.</b><br />Most likely this is a temporary problem - please, try again in a few minutes.");
}

pdo_query('SET NAMES utf8');
