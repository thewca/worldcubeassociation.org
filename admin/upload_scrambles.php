<?php

$jQuery = 1;
$currentSection = 'admin';
require('../includes/_header.php');
adminHeadline('Upload Scrambles');

$scripts = new WCAClasses\WCAScripts();
$scripts->add('scramble_upload_help.js');
print $scripts->getHTMLAll();


// create form structure
$form = new WCAClasses\FormBuilder(
  "scramble-submission",
  array(
    'method' => 'POST',
    'enctype' => 'multipart/form-data'
    )
  );

$form->addEntity(
  new WCAClasses\FormBuilderEntities\Markup("<fieldset><legend>Upload Scrambles</legend>")
  );

// competition to upload scrambles for
$competitions_raw = getAllCompetitions();
$competitions = array();
foreach($competitions_raw as $data) {
  $competitions[$data['id']] = $data['cellName'];
}
$competition_element = new WCAClasses\FormBuilderEntities\Select("competitionId", $competitions);
$competition_element->label("Competition");
$form->addEntity($competition_element);

// json file upload element
$file_element = new WCAClasses\FormBuilderEntities\Input("scrambles", "file");
$file_element->attribute("accept", ".json")
       ->label("Select JSON File")
       ->validator("");
$form->addEntity($file_element);

// notice area
$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("<div id='notice_area' style='clear: both;'></div>"));

// submit button
$submit_element = new WCAClasses\FormBuilderEntities\Input("submit", "submit");
$submit_element->attribute("value", "Upload");
$form->addEntity($submit_element);

$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("</fieldset>"));


// process submitted data
if($form->submitted()) {
  $submitted_data = $form->submittedData();

  // Submitting for a valid competition?
  if(!array_key_exists($submitted_data['competitionId'], $competitions)) {
    $form->invalidate('competitionId', 'Invalid Competition.');
  }

  // make sure file contains valid JSON
  if(!isset($_FILES['scrambles'])) {
    $_FILES['scrambles'] = NULL;
    $form->invalidate('scrambles', 'Please upload a file.');
  }
  $max_size = 1000000; // 1 MB?
  $size = filesize($_FILES['scrambles']['tmp_name']);
  if($size > $max_size) {
    $form->invalidate("scrambles", 'The file size is too big.');
  }
  $contents = file_get_contents($_FILES['scrambles']['tmp_name']);
  if(!($competition_data = json_decode($contents))) {
    $form->invalidate('scrambles', 'Please upload a valid JSON file.');
  }

  if(is_object($competition_data)) {
    if(property_exists($competition_data, 'scrambles')) {
      $scramble_data = $competition_data->scrambles;
    } else {
      $form->invalidate('scrambles', 'Please upload a JSON file containing scrambles.');
    }
  }

  // deal with uploaded data
  if($form->validate() === TRUE) {
    $compId = $submitted_data['competitionId'];
    // store JSON in db
    $round_errors = array();
    foreach ($scramble_data->sheets as $round => $data) {
      // round data
      $eventId = property_exists($data, 'event') ? ($data->event) : false;
      $roundId = property_exists($data, 'round') ? ($data->round) : false;
      $groupId = property_exists($data, 'group') ? ($data->group) : false;

      if($eventId && $roundId && $groupId) {
        
        // remove any existing scrambles for this round/group?
        $existing_scrambles = $wcadb_conn->boundQuery("SELECT scrambleId FROM Scrambles
              WHERE competitionId=? AND eventId=? AND roundId=? AND groupId=?",
            array('ssss', &$compId, &$eventId, &$roundId, &$groupId)
          );
        if(count($existing_scrambles) > 0) {
          $wcadb_conn->boundCommand("DELETE FROM Scrambles WHERE
                competitionId=? AND eventId=? AND roundId=? AND groupId=?",
              array('ssss', &$compId, &$eventId, &$roundId, &$groupId)
            );
          $round_errors[] = "Scrambles already exist for this round and group!
            Data from the round with the following data was replaced.<br /><br />
            eventId: `<pre style='display: inline;'>$eventId</pre>`<br />
            roundId: `<pre style='display: inline;'>$roundId</pre>`<br />
            groupId: `<pre style='display: inline;'>$groupId</pre>`<br /><br />
          ";
        }

        // Store normal scrambles
        $num = 1;
        foreach($data->scrambles as $scramble) {
          $wcadb_conn->boundCommand("INSERT INTO Scrambles
                (competitionId, eventId, roundId, groupId, isExtra, scrambleNum, scramble)
                VALUES (?, ?, ?, ?, 0, ?, ?)",
              array('ssssis', &$compId, &$eventId, &$roundId, &$groupId, &$num, &$scramble)
            );
          $num++;
        }

        // Store extra scrambles
        $num = 1;
        foreach($data->extraScrambles as $scramble) {
          $wcadb_conn->boundCommand("INSERT INTO Scrambles
                (competitionId, eventId, roundId, groupId, isExtra, scrambleNum, scramble)
                VALUES (?, ?, ?, ?, 1, ?, ?)",
              array('ssssis', &$compId, &$eventId, &$roundId, &$groupId, &$num, &$scramble)
            );
          $num++;
        }
      } else {
        $round_errors[] = "Metadata was missing from scrambles in the JSON object!
            Data from the round with the following data was not imported.<br /><br />
            eventId: `<pre style='display: inline;'>$eventId</pre>`<br />
            roundId: `<pre style='display: inline;'>$roundId</pre>`<br />
            groupId: `<pre style='display: inline;'>$groupId</pre>`<br /><br />
          ";
      }

    }

    if($round_errors) {
      showErrors($round_errors);
    }

  } else {
    showErrors($form->validate());
  }

}

// render form
print $form->render();

require('../includes/_footer.php');
