<?php

$currentSection = 'persons';
require( '../includes/_header.php' );

$form = new WCAClasses\FormBuilder("submission");
$form->render();

require( '../includes/_footer.php' );
