<?php

if(!isset($_REQUEST['personId']) && isset($_REQUEST['i']))
  $_REQUEST['personId'] = $_REQUEST['i'];

require( 'person.php' );
