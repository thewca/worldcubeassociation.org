<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( 'includes/_header.php' );
require( 'includes/_upload.php' );
require( 'includes/_json.php' );
require( 'includes/_check.php' );
require( 'includes/competition_results.php' );

#
#
#
#           Note from Stefan: this script is still rather messy (in particular, some things
#           are implemented in multiple ways caus I can't make up my mind what's the better
#           way), but I'm uploading it so others can test it and maybe someone else work on
#           it if they dare to.
#
#
#
# TODO:
#   - require HTTPS for showing the form at all
#   - limits for file size, number of competitors, etc
#   - check JSON structure
#   - CREATE TABLE InboxResults LIKE Results
#   - ALTER TABLE InboxResults DROP id
#   - CREATE TABLE InboxPersons LIKE Persons
#   - ALTER TABLE InboxPersons ADD fromCompetitionId varchar(32) NOT NULL
#   - ALTER TABLE InboxPersons ADD tmpId INT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY ( tmpId )
#   - Make the values MySQL-safe or use a layer
#   - store the competitionId in the Inbox* table rows
#   - try levenshtein vs similar_text, the former is supposed to be faster. And check where the time is lost, maybe sorting plays a role as well?
#   - Check the password
#   - Warn about unreasonable birth dates
#   - Person name and id are in wrong order, should be in JSON like it is in the database (and I think in excel, too)
#   - Warn if two people have the same birthdate or if birthdate suspicious (like January 1st, or year<1920)

analyzeChoices();
echo "<p>Note: This is not finished yet, this is a preview only. So far you can upload a .json file produced by Lars' tool and some checks will be run on it and the data is stored in the inbox tables and shown from there, but the checking isn't finished yet and there's no transfer from inbox to main tables yet.<p>\n";
if( !$chosenSubmit )
  offerUpload();
else {
  try {
    $error = handleUpload();
    noticeBox(true, 'No errors found');
  } catch (Exception $e) {
    noticeBox(false, $e->getMessage());
  }
}

#--- Show the current inbox data for this competition
echo "<p>Persons from $chosenCompetitionId currently in the InboxPersons table (only new ones, those without ID):</p>";
tableBegin('results', 6);
tableHeader(explode('|', 'Name|CountryId|Gender|Year|Month|Day'), array(5 => 'class="f"'));
$newPersons = dbQuery("SELECT * FROM InboxPersons WHERE fromCompetitionId='$chosenCompetitionId' AND id='' ORDER BY name");
foreach ($newPersons as $person)
  tableRow(array($person['name'], $person['countryId'], $person['gender'], $person['year'], $person['month'], $person['day']));
tableEnd();
echo "<p>Results from $chosenCompetitionId currently in the InboxResults table:</p>";
$chosenAllResults = true;
showCompetitionResults('InboxResults');

require( 'includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $chosenSubmit;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenPassword      = getNormalParam( 'password' );
  $chosenSubmit        = getBooleanParam( 'submit' );
}

#----------------------------------------------------------------------
function offerUpload () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;

  echo "<p>Upload the &lt;$chosenCompetitionId.json&gt; file here.<p>\n";
  showUploadForm('competition_results_upload.php', array('competitionId'=>$chosenCompetitionId, 'password'=>$chosenPassword));

/*
require( 'includes/competition_eximport.php' );
startTimer();
exportCompetitionToJson( 'USNationals2012' );
stopTimer('competitionToJson');

startTimer();
pretty(importCompetitionFromJson( 'zzz_json/USNationals2012.wcac' ));
stopTimer('competitionFromJson');
*/

}

#----------------------------------------------------------------------
function handleUpload () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $checkingErrors;

  $checkingErrors = array();
  
  #TODO: make everything with exceptions, then use these instead?
  #--- Check the upload, decode JSON, check the data
  #$tempFilename = checkUpload(200, 'json');
  #$data = wca_decode_json(file_get_contents($tempFilename));
  #checkCompetitionData($data);

  #--- Check the upload, cry and stop if error
  list($tempFilename, $error) = checkUpload(200000, '.json');
  if ($error)
    return "Upload error: $error";

  #--- Decode the JSON, cry and stop if error
  list($data, $error) = wca_decode_json(file_get_contents($tempFilename));
  if ($error)
    return "JSON error: $error";

  #--- Check the data structure
  $error = checkCompetitionData($data);
  if ($error)
    return "Data error: $error";

  #if( $checkingErrors )
  #  throw new Exception(implode('<br />', $checkingErrors));

  #pretty( array_keys($data) );
  #pretty( $data['formatVersion'] );
  #pretty( $data['persons'] );
  #pretty( $data['results'] );

  # TODO
  # if this competition already exists in the database, show an error and offer to delete it there to try again

  #pretty($data);

  #--- Delete obsolete data for this competition from the inbox tables (TODO: this should be tested and asked about first)
  dbCommand("DELETE FROM InboxPersons WHERE fromCompetitionId='$chosenCompetitionId'");
  dbCommand("DELETE FROM InboxResults WHERE competitionId='$chosenCompetitionId'");
  
  #--- Insert the persons into the InboxPersons table
  $values = array();
  foreach( $data['persons'] as $person ){
    $person[] = $chosenCompetitionId;
    $v = array_map('mysql_real_escape_string', $person);
    $values[] = "('" . implode( "', '", $v ) . "')";
  }
  $values = implode( ",\n", $values );
  dbCommand( "INSERT INTO InboxPersons (name, id, countryId, gender, year, month, day, fromCompetitionId) VALUES\n$values" );

  #--- Insert the results into the InboxResults table
  $fields = 'pos, personName, personId, countryId, competitionId, eventId, roundId, formatId, value1, value2, value3, value4, value5, best, average, regionalSingleRecord, regionalAverageRecord';
  $values = array();
  foreach( $data['results'] as $result ){
    $v = array_map('mysql_real_escape_string', $result);
    $values[] = "('" . implode( "', '", $v ) . "')";
  }
  $values = implode( ",\n", $values );
  dbCommand( "INSERT INTO InboxResults ($fields) VALUES\n$values" );

  #--- Report success (no error)
  return false;
}

#----------------------------------------------------------------------
function checkCompetitionData ($data) {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $checkingContext;

  #--- Prepare valid values for later checking
  $countryIdSet = getIdSet('Countries');
  $competitionIdSet = array($chosenCompetitionId => true);
  $personIds    = getIdSet('Persons');
  $eventIdSet   = getIdSet('Events');
  $roundIdSet   = getIdSet('Rounds');
  $formatIdSet  = getIdSet('Formats');
  $genderSet    = array('m'=>true, 'f'=>true, ''=>true);
  $knownPersons = array();
  foreach( dbQuery("SELECT name, id, countryId, gender, year, month, day FROM Persons WHERE subId=1") as $person )
    $knownPersons[$person['id']] = $person;

  #--- Check root type and keys
  checkArray('root', $data, 3, 'formatVersion|persons|results');
  if( ! is_array($data) )                       return "root is not an array";
  if( ! isset($data['formatVersion']))          return "missing formatVersion";
  if( ! isset($data['persons']))                return "missing persons";
  if( ! isset($data['results']))                return "missing results";
  if( count($data) != 3 )                       return "extra root fields besides formatVersion/persons/results";

  #--- Check formatVersion
  $formatVersion = $data['formatVersion'];
  if( ! is_string($formatVersion))              return "formatVersion is not a string";
  if( $formatVersion != 'WCA Competition 0.1' ) return "wrong formatVersion '" . htmlEscape($formatVersion) + "'";

  #--- Check persons
  $persons = $data['persons'];
  checkArray('persons', $persons);
  $personNameIdCountryId = array();
  foreach( $persons as $person ){
    checkArray('person', $person, 7);
    $checkingContext = 'In list of persons:<br />(' . implode(', ', array_map('htmlEscape', $person)) . ')';
    list($name, $id, $countryId, $gender, $year, $month, $day) = $person;
    checkStr('name', $name, 3);
    checkStr('countryId', $countryId, $countryIdSet);
    checkStr('personId', $id, '/^(|\d{4}[A-Z]{4}\d{2})$/');
    checkStr('gender', $gender, $genderSet);
    checkInt('year', $year, 1900, 2015);
    checkInt('month', $month, 1, 12);
    checkInt('day', $day, 1, date('t', strtotime("$year-$month-1")));  # 't' is number of days in that month
    if($id){
      checkStr('personId', $id, $knownPersons);
      $known = $knownPersons[$id];
      checkStr('name', $name, false, $known['name']);
      checkStr('countryId', $countryId, false, $known['countryId']);
      if($known['gender']) checkStr('gender', $gender, false, $known['gender']);
      if($known['year'])   checkEqual('year', $year, intval($known['year']));
      if($known['month'])  checkEqual('month', $month, intval($known['month']));
      if($known['day'])    checkEqual('day', $day, intval($known['day']));
    }
    $personNameIdCountryId["$name|$id|$countryId"] = $person;
    #TODO: report data conflicting with Persons table (gender and birthdate), though allow update of missing data?
    #TODO: name starts or ends with space or has double spaces.
  }

  #TODO: use a regular table for showing errors? So they're nice and compact and with column headers?
  # Check that persons match the persons in results
  # Check for duplicates in persons

  #--- Check results
  $results = $data['results'];
  checkArray('results', $results);
  foreach( $results as $result ){

    checkArray('result', $result, 17);
    $checkingContext = 'In list of results:<br />(' . implode(', ', array_map('htmlEscape', $result)) . ')';
    list($pos, $personName, $personId, $countryId, $competitionId, $eventId, $roundId, $formatId, $v1, $v2, $v3, $v4, $v5, $best, $average, $rSR, $rAR) = $result;
    #TODO: throw rSR/rAR out of the format cause I ain't gonna use it anyway?
    #TODO: switch order of personName and personId to what it is in the database

    #--- Type checks for all fields (with some content checks)
    checkInt('pos', $pos, 1, 999);
    checkStr('personName', $personName, 3);
    checkStr('personId', $personId, '/^(|\d{4}[A-Z]{4}\d{2})$/');
    checkStr('countryId', $countryId, $countryIdSet);
    checkStr('competitionId', $competitionId, "/^$chosenCompetitionId$/");
    checkStr('eventId', $eventId, $eventIdSet);
    checkStr('roundId', $roundId, $roundIdSet);
    checkStr('formatId', $formatId, $formatIdSet);
    checkInt('value1', $v1, -2, PHP_INT_MAX);
    checkInt('value2', $v2, -2, PHP_INT_MAX);
    checkInt('value3', $v3, -2, PHP_INT_MAX);
    checkInt('value4', $v4, -2, PHP_INT_MAX);
    checkInt('value5', $v5, -2, PHP_INT_MAX);
    checkInt('best', $best, -2, PHP_INT_MAX);
    checkInt('average', $average, -2, PHP_INT_MAX);

    #--- Content checks for some fields
    if($personId) checkStr('personId', $personId, $personIds);
    checkStr('person', "$personName|$personId|$countryId", $personNameIdCountryId);
    # 'pos personName personId countryId competitionId eventId roundId formatId v1 v2 v3 v4 v5 best average rSR rAR'

    #$error = checkResult(array('eventId'=>$eventId, 'roundId'=>$roundId, 'formatId'=>$formatId, 'value1'=>$v1, 'value2'=>$v2, 'value3'=>$v3, 'value4'=>$v4, 'value5'=>$v5, 'best'=>$best, 'average'=>$average));
    list($row, $error) = extractArray($result, 'pos:integer personId:string personName:string countryId:string ' .
      'competitionId:string eventId:string roundId:string formatId:string ' .
      'value1:integer value2:integer value3:integer value4:integer value5:integer ' .
      'best:integer average:integer regionalSingleRecord:string regionalAverageRecord:string');
    if( $error )
      addError( $error );
    else {
      $error = checkResult($row, $countryIdSet, $competitionIdSet, $eventIdSet, $formatIdSet, $roundIdSet);
      if( $error )
        addError( $error );
    }
  }
  
  #TODO: report persons in Persons who don't appear in Results
  #TODO: persons in Results that appear more than once in the same round, event and competition. Or other duplicates?
  #TODO: compare the events with the events specified in the Competitions table entry
}

#----------------------------------------------------------------------
function extractArray ($array, $specs) {
#----------------------------------------------------------------------

  #--- Check that it's really an array
  if (!is_array($array))
    return array(false, 'not an array');

  #--- Get the specs and check that the array has the correct length
  $specs = explode(' ', $specs);
  if (count($array) != count($specs))
    return array(false, count($array) . ' elements instead of ' . count($specs));

  #--- Extract the values and check their types
  $out = array();
  foreach ($specs as $spec) {
    list($key, $type) = explode(':', $spec);
    $value = array_shift($array);
    if (gettype($value) != $type)
      return array(false, "<b>$key</b> is " . gettype($value) . " but should be $type.");
    $out[$key] = $value;
  }

  #--- All ok, so return the associative array and no error
  return array($out, false);
}

#----------------------------------------------------------------------
function getIdSet ($table) {
#----------------------------------------------------------------------
  $ids = array();
  foreach( dbQuery("SELECT id FROM $table") as $row )
    $ids[$row['id']] = true;
  return $ids;
}

#----------------------------------------------------------------------
function checkArray ($name, $value, $length=false, $keys=false) {
#----------------------------------------------------------------------
  if( ! is_array($value) )                  addError("$name is not an array");
  if( $length && count($value) != $length ) addError("$name has " . count($value) . " elements instead of $length");
  #TODO: keys
}

#----------------------------------------------------------------------
function checkInt ($name, $value, $min, $max) {
#----------------------------------------------------------------------
  if( ! is_int($value) )               addError("$name is not an integer");
  if( $value < $min || $value > $max ) addError("$name '$value' outside of allowed range $min..$max");
  #TODO: provide more context info, e.g., the personName whose date is bad
}

#----------------------------------------------------------------------
function checkStr ($name, $value, $check=false, $exact=false) {
#----------------------------------------------------------------------
  if( ! is_string($value) )                         addError("$name is not a string");
  if( is_int($check) && strlen($value) < $check )   addError("$name '" . htmlEscape($value). "' is too short (min $check characters)");
    #TODO: multibyte?
  if( is_array($check) && ! isset($check[$value]) ) addError("bad $name '" . htmlEscape($value) . "'");
  if( is_string($check) && ! preg_match($check, $value) ) addError("bad $name '" . htmlEscape($value) . "'$check");
  if( $exact && $value != $exact )                  addError("bad $name '" . htmlEscape($value) . "' (expecting '$exact')");
}

#----------------------------------------------------------------------
function checkEqual ($name, $value, $expect) {
#----------------------------------------------------------------------
  if( $value !== $expect ) addError("bad $name '" . htmlEscape($value) . "' (expecting '$expect')");
}

#----------------------------------------------------------------------
function addError ($error) {
#----------------------------------------------------------------------
  global $checkingErrors, $checkingContext;
  $checkingErrors[] = $checkingContext . ":<br />" . $error;
  noticeBox( false, $checkingContext . ":<br />" . $error );
}

?>
