<?php

$jQuery = 1;
$jQuery_chosen = 1;
$currentSection = 'admin';
require('../includes/_header.php');
adminHeadline('Upload Competition Results &amp; Scrambles');

$scripts = new WCAClasses\WCAScripts();
$scripts->add('data_upload_help.js');
print $scripts->getHTMLAll();

// create form structure
$form = new WCAClasses\FormBuilder(
  "results-submission",
  array(
    'method' => 'POST',
    'enctype' => 'multipart/form-data'
    )
  );

$form->addEntity(
  new WCAClasses\FormBuilderEntities\Markup("<fieldset><legend>Upload Results &amp; Scrambles</legend>")
  );

// competition to upload JSON for
$competitions_query = "SELECT id, name, countryId
                       FROM Competitions
                       ORDER BY (STR_TO_DATE(CONCAT(year,',',month,',',day),'%Y,%m,%d') BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY)) DESC,
                          year DESC, month DESC, day DESC
                       ";
$competitions = $wcadb_conn->dbQuery($competitions_query);
$options = array();
foreach($competitions as $competition) {
  $options[$competition->id] =
          ($competition->name) . " | "
          . ($competition->id) . " | "
          . ($competition->countryId);
}
$competition_element = new WCAClasses\FormBuilderEntities\Select("competitionId", $options);
$competition_element->label("Competition");
$form->addEntity($competition_element);

// competition data area
$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("<div id='notice_area' style='clear: both;'></div>"));
$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("<div class='thick-outlined'>"));

// json file upload element
$file_element = new WCAClasses\FormBuilderEntities\Input("json", "file");
$file_element->attribute("accept", ".json")
       ->label("Select JSON File to Import")
       ->validator("");
$form->addEntity($file_element);

// submit button
$submit_element = new WCAClasses\FormBuilderEntities\Input("submit", "submit");
$submit_element->attribute("value", "Upload");
$form->addEntity($submit_element);

// clear temp results button
$submit_element = new WCAClasses\FormBuilderEntities\Input("submit", "submit");
$submit_element->attribute("value", "Upload");
$form->addEntity($submit_element);

$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("</div>"));
$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("</fieldset>"));

// process submitted data
if($form->submitted()) {
  $submitted_data = $form->submittedData();

  // make sure file contains valid JSON
  if(!isset($_FILES['json'])) {
    $_FILES['json'] = NULL;
    $form->invalidate('json', 'Please upload a file.');
  }
  $max_size = 1000000; // 1 MB?
  $size = filesize($_FILES['json']['tmp_name']);
  if($size > $max_size) {
    $form->invalidate("json", 'The file size is too big.');
  }
  $contents = file_get_contents($_FILES['json']['tmp_name']);
  //check bom header
  if (ord($contents{0}) == 239 && ord($contents{1}) == 187 && ord($contents{2}) == 191) {
    $contents = substr($contents, 3);
  }
  if(!($competition_data = json_decode($contents))) {
    $form->invalidate('json', 'Please upload a valid JSON file.');
  }

  if(is_object($competition_data)) {
    // check json for results data
    // check for correct comp ID
    if(property_exists($competition_data, 'competitionId')) {
      $json_comp_id = $competition_data->competitionId;
      $form_comp_id = $submitted_data['competitionId'];
      if($json_comp_id != $form_comp_id) {
        $form->invalidate('competitionId', 'The competition ID `'.o($form_comp_id).'` does not match the the JSON file `'.o($json_comp_id).'`.');
      }
    } else {
      $form->invalidate('json', 'Please upload a JSON file containing a competition ID.');
    }
    
    // check for valid persons data structure
    if(!property_exists($competition_data, 'persons') || !is_array($competition_data->persons)) {
      $form->invalidate('json', 'Person data malformed or not present in JSON.');
    }

    // check for valid results/scramble data structure
    if(!property_exists($competition_data, 'events') || !is_array($competition_data->events)) {
      $form->invalidate('json', 'Event data malformed or not present in JSON.');
    }

  }  // end object validation

  // deal with uploaded data
  if($form->validate() === TRUE) {
    $compId = $submitted_data['competitionId'];
    
    // store JSON in db

    // store person data in InboxPersons first
    $round_errors = array();
    $persons = array();
    foreach($competition_data->persons as $person) {
      $id = property_exists($person, 'id') ? ($person->id) : false;
      $name = property_exists($person, 'name') ? ($person->name) : false;
      $wcaId = property_exists($person, 'wcaId') ? ($person->wcaId) : "";
      $countryId = property_exists($person, 'countryId') ? ($person->countryId) : false;
      $gender = property_exists($person, 'gender') ? ($person->gender) : false;
      $dob = property_exists($person, 'dob') ? ($person->dob) : false;

      // name, country are required; others can have 'empty' values (OK to fill in later)
      if($id !== false && $name && $wcaId !== false && $countryId && $gender !== false && $dob !== false) {
        // submit data
        $wcadb_conn->boundCommand("INSERT INTO InboxPersons
                (competitionId, id, name, wcaId, countryId, gender, dob)
                VALUES (?, ?, ?, ?, ?, ?, ?)",
              array('sssssss', &$compId, &$id, &$name, &$wcaId, &$countryId, &$gender, &$dob)
            );
      } else {
        $round_errors[] = "Person data too incomplete for person with name: `".o($name)."`. This person was not entered into the database.";
      }
    }

    // store results & scrambles in inbox tables
    foreach ($competition_data->events as $event) {
      $eventId = property_exists($event, 'eventId') ? ($event->eventId) : false;

      // check to make sure rounds exist for event
      if(!property_exists($event, 'rounds')) {
        $round_errors[] = "Event has no round data: `".o($eventId)."`.";
        $event->rounds = array();
      }

      // cycle through rounds
      foreach ($event->rounds as $round) {
        $roundTypeId = property_exists($round, 'roundId') ? ($round->roundId) : false;
        $formatId = property_exists($round, 'formatId') ? ($round->formatId) : false;

        // check to make sure results exist for round
        if(!property_exists($round, 'results')) {
          $round_errors[] = "Round has no result data: `".o($eventId)."`:`".o($roundTypeId)."`.";
          $round->results = array();
        }

        // store results
        foreach($round->results as $result) {
          $personId = property_exists($result, 'personId') ? ($result->personId) : false;
          $position = property_exists($result, 'position') ? ($result->position) : false;
          $results = property_exists($result, 'results') ? ($result->results) : false;
            $results = array_pad($results, 5, 0);
          $value1 = $results[0];
          $value2 = $results[1];
          $value3 = $results[2];
          $value4 = $results[3];
          $value5 = $results[4];
          $best = property_exists($result, 'best') ? ($result->best) : false;
          $average = property_exists($result, 'average') ? ($result->average) : false;

          // all values are required; results can be '0' though
          if($eventId !== false && $roundTypeId !== false && $formatId !== false && $personId !== false && $position !== false && $results !== false && $best !== false && $average !== false) {
            // submit data
            $wcadb_conn->boundCommand("INSERT INTO InboxResults
                    (competitionId, eventId, roundTypeId, formatId, personId,
                      pos, value1, value2, value3, value4, value5, best, average)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                  array('sssssiiiiiiii', &$compId, &$eventId, &$roundTypeId, &$formatId, &$personId,
                    &$position, &$value1, &$value2, &$value3, &$value4, &$value5, &$best, &$average)
                );
          } else {
            $round_errors['bad_results'] = "Result data incomplete: some data was not imported.  Please make sure all result metadata was included.";
          }

        }


        // check to make sure groups exist for round
        if(!property_exists($round, 'groups')) {
          $round_errors[] = "Round has no group/scramble data: `".o($roundTypeId)."`.";
          $round->groups = array();
        }

        // store scrambles
        foreach ($round->groups as $group) {
          $groupId = property_exists($group, 'group') ? ($group->group) : false;

          // Store normal scrambles
          if(!property_exists($group, 'scrambles')) {
            $round_errors[] = "Group has no scramble data: `".o($eventId)."`:`".o($roundTypeId)."`:`".o($groupId)."`.";
            $group->scrambles = array();
          }
          $num = 1;
          foreach($group->scrambles as $scramble) {
            $wcadb_conn->boundCommand("INSERT INTO Scrambles
                  (competitionId, eventId, roundTypeId, groupId, isExtra, scrambleNum, scramble)
                  VALUES (?, ?, ?, ?, 0, ?, ?)",
                array('ssssis', &$compId, &$eventId, &$roundTypeId, &$groupId, &$num, &$scramble)
              );
            $num++;
          }

          // Store extra scrambles
          if(property_exists($group, 'extraScrambles')) {
            // no alert if these don't exist
            $num = 1;
            foreach($group->extraScrambles as $scramble) {
              $wcadb_conn->boundCommand("INSERT INTO Scrambles
                    (competitionId, eventId, roundTypeId, groupId, isExtra, scrambleNum, scramble)
                    VALUES (?, ?, ?, ?, 1, ?, ?)",
                  array('ssssis', &$compId, &$eventId, &$roundTypeId, &$groupId, &$num, &$scramble)
                );
              $num++;
            }
          }

        }

      } // end cycling through rounds

    } // end cycling through events


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
