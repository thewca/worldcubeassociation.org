<?php

// session_start is done in _framework.php file.

// "remember" admins... for a session at least.
$is_admin = false;
if(isset($_SESSION['is_admin']) && $_SESSION['is_admin']) {
  $is_admin = true;
}
if($currentSection == 'admin') {
  $_SESSION['is_admin'] = true;
  $is_admin = true;
}
