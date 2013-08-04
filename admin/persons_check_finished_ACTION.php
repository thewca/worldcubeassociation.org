<?php

$currentSection = 'admin';
require( '../includes/_header.php' );
adminHeadline( 'Check finished persons' );


$action = getRawParamThisShouldBeAnException('action');
$command = '';
$params = array();

switch($action) {
  case "fix_person_name":
    $old_name = getRawParamThisShouldBeAnException('old_name');
    $new_name = getRawParamThisShouldBeAnException('new_name');

    $command = 'UPDATE Persons SET name = ? WHERE name = ?';
    $params = array('ss', &$new_name, &$old_name);

    break;

  case "fix_results_name":

    $old_name = getRawParamThisShouldBeAnException('old_name');
    $new_name = getRawParamThisShouldBeAnException('new_name');

    $command = 'UPDATE Results SET personName = ? WHERE personName = ?';
    $params = array('ss', &$new_name, &$old_name);

    break;

  case "fix_results_data":
    $old_id = getRawParamThisShouldBeAnException('old_id');
    $old_name = getRawParamThisShouldBeAnException('old_name');
    $old_country = getRawParamThisShouldBeAnException('old_country');
    $new_id = getRawParamThisShouldBeAnException('new_id');
    $new_name = getRawParamThisShouldBeAnException('new_name');
    $new_country = getRawParamThisShouldBeAnException('new_country');
    
    $command = 'UPDATE Results SET personId = ?, personName = ?, countryId = ? WHERE personId = ? AND personName = ? AND countryId = ?';
    $params = array('ssssss', &$new_id, &$new_name, &$new_country, &$old_id, &$old_name, &$old_country);

    break;
}

if($action && $command && !empty($params)) {
  $wcadb_conn->boundCommand($command, $params);
  print '<p>The following query was executed:<br /><br />';
  print highlight($command);
  print '<br />With parameters:';
  foreach($params as $param) {
    print '<br /> * <span style="color:#F00">'.$param.'</span>';
  }
  print '</p>';
} else {
  print '<p>Nothing to do.</p>';
}

print '<p><a href="persons_check_finished.php">Back to checking finished persons</a></p>';

require( '../includes/_footer.php' );
