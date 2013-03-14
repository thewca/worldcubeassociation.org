<?php
// session information needs to be created before <html> tag is output.  Thus this php code should come at the beginning of the file.
if ( ! preg_match( '/worldcubeassociation.org$/i', $_SERVER["SERVER_NAME"] ) ) {
  error_reporting(E_ALL);
  ini_set("display_errors", 1);
}
require_once( '_framework.php' );
$standAlone = getBooleanParam( 'standAlone' );

?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<title>World Cube Association - Official Results</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="author" content="Ron van Bruchem, Stefan Pochmann, Clément Gallet, Josef Jelinek" />
<meta name="description" content="Official World Cube Association Competition Results" />
<meta name="keywords" content="rubik's cube,puzzles,competition,official results,statistics,WCA" />
<link rel="shortcut icon" href="<?= pathToRoot() ?>images/wca.ico" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/general.css" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/pageMenu.css" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/tables.css" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/links.css" />
<?= isset( $extraHeaderStuff ) ? $extraHeaderStuff : '' ?>
</head>

<body>
<?php if (!$standAlone) { ?>
<div id="main">
<div id="content">
<?php
  $sections = array(
    array( 'Home',         'home', '../'  ),
    array( 'Rankings',     'events'       ),
    array( 'Records',      'regions'      ),
    array( 'Competitions', 'competitions' ),
    array( 'Persons',      'persons'      ),
    array( 'Multimedia',   'media'        ),
    array( 'Statistics',   'statistics'   ),
    array( 'Misc',         'misc'         ),
  );
  if ($currentSection == 'admin') {
    $sections[] = array('Admin', 'admin', 'admin/');
  }

  if (!preg_match( '/worldcubeassociation.org$/', $_SERVER["SERVER_NAME"])) {
    noticeBox3( 0, "Note: This is only a copy of the WCA results system used for testing stuff. The official WCA results are at:<br /><a href='http://www.worldcubeassociation.org/results/'>http://www.worldcubeassociation.org/results/</a>" );
  }

  // only show errors in admin section
  if($currentSection == 'admin' && isset($installation_errors) && !empty($installation_errors)) {
    showErrors($installation_errors);
  }
?>

<div id="pageMenuFrame">
  <div id="pageMenu">
    <ul class="navigation">
      <?php print_menu($sections, $currentSection); ?>
    </ul>
  </div>
</div>

<div id='header'>World Cube Association<br />Official Results</div>
<?php } ?>

<?php startTimer(); ?>
