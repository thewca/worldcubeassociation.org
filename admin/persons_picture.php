<?php

$currentSection = 'admin';
require('../includes/_header.php');

adminHeadline('Person pictures');
$upload_path = "../upload/";

// get list of unapproved photo files
$files = array();
if($handle = opendir($upload_path)) {
  while((count($files) < 10) && (false !== ($file = readdir($handle)))) {
    if($file[0] == 'p'){
      $files[] = $file;
    }
  }
  closedir($handle);
}

// Form for validating submissions
$form = new WCAClasses\FormBuilder("photo-submission-approval");
foreach($files as $file) {
  $personId = substr($file, 1, 10);
  $person = $wcadb_conn->boundQuery("SELECT * FROM Persons WHERE id = ?", array('s', &$personId));
  if(count($person) == 1) {
    $person = $person[0];
    $form->addEntity(new WCAClasses\FormBuilderEntities\Radio($personId, array("A" => "Accept", "D" => "Decline", "R" => "Defer")));
  } else {
    print "ERROR - picture present not associated with a valid ID (" . o($personId) . ")!";
  }
}

// process form submission
if($form->submitted()) {
  if($form->validate() === TRUE) {
    $submitted_data = $form->submittedData();
    // (re)move files that have been (dis)approved.
    foreach($files as $file){
      $personId = substr($file, 1, 10);
      if($submitted_data[$personId] == 'A'){
        if($handle = opendir($upload_path)) {
          while(false !== ($a_file = readdir($handle))) 
            if(substr($a_file, 0, 11) == ('a' . $personId))
              unlink($upload_path . $a_file);
          closedir($handle);
        }
        rename($upload_path . $file, $upload_path . 'a' . substr($file, 1));
      }
      if($submitted_data[$personId] == 'D') {
        unlink($upload_path . $file);
      }
    }
  } else {
    showErrors($form->validate());
  }
}

// re-read files / repopulate form.
$files = array();
if($handle = opendir($upload_path)) {
  while((count($files) < 10) && (false !== ($file = readdir($handle)))) {
    if($file[0] == 'p'){
      $files[] = $file;
    }
  }
  closedir($handle);
}

// display form for any new needed photos
if(count($files) == 0){
  // if no files to accept, then:
  print "<p>No new pictures have been submitted.</p>";
} else {
  // otherwise, output form:
  $form = new WCAClasses\FormBuilder("photo-submission-approval");
  $form->addEntity(new WCAClasses\FormBuilderEntities\Markup("<fieldset><legend>Photo Submission Approval</legend>"));

  foreach($files as $file) {
    $personId = substr($file, 1, 10);
    $person = $wcadb_conn->boundQuery("SELECT * FROM Persons WHERE id = ?", array('s', &$personId));

    if(count($person) == 1) {
      $person = $person[0];
      $form->addEntity(new WCAClasses\FormBuilderEntities\Radio($personId, array("A" => "Accept", "D" => "Decline", "R" => "Defer")));
      $form->addEntity(new WCAClasses\FormBuilderEntities\Markup("<div class='titled-image'>
        <img src='" . $upload_path . $file . "' class='person' />
        <span class='titled-image-title'>" . personLink($personId, $person['name']) . "</span></div>"
        ));
    } else {
      print "ERROR - picture present not associated with a valid ID (" . o($personId) . ")!";
    }
  }
  $submit_element = new WCAClasses\FormBuilderEntities\Input("submit", "submit");
  $submit_element->attribute("value", "Submit!");
  $form->addEntity($submit_element);
  $form->addEntity(new WCAClasses\FormBuilderEntities\Markup("</fieldset>"));
  print $form->render();
}

require( '../includes/_footer.php' );
