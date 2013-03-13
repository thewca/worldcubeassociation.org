<?php

include("../includes/_form.class.php");

$form = new FormBuilder();
$form->element("user")->setAttribute("type", "text")->setLabel("Enter username:");
$form->element("password")->setAttribute("type", "password")->setLabel("Enter password:");
$form->element("Submit")->setAttribute("type", "submit")->setAttribute("value", "'Submit'");

print $form->render();

