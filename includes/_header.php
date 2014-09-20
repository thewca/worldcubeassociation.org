<?php
// session information needs to be created before <html> tag is output.  Thus this php code should come at the beginning of the file.
if ( ! preg_match( '/worldcubeassociation.org$/i', $_SERVER["SERVER_NAME"] ) ) {
  // if not on WCA server, in development environment - show errors.
  error_reporting(E_ALL);
  ini_set("display_errors", 1);
}
require_once( '_framework.php' );
$standAlone = getBooleanParam( 'standAlone' );

?><!doctype html><html lang="en">
<head>
<title>World Cube Association - Official Results</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="author" content="WCA Website Team" />
<meta name="description" content="Official World Cube Association Competition Results" />
<meta name="keywords" content="rubik's cube,puzzles,competition,official results,statistics,WCA" />
<link rel="shortcut icon" href="<?php print pathToRoot(); ?>images/wca.ico" />

<?php

$jQuery = true; // For bootstrap.

/* Deal with scripts here, for now */
$scripts = new WCAClasses\WCAScripts();
if(isset($jQuery) && $jQuery) {
  $scripts->add('//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js');
}
if(isset($jQueryUI) && $jQueryUI) {
  $scripts->add('//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min.js');
}
if(!isset($is_admin) || !$is_admin) {
  $scripts->add('ga.js');
}
if(isset($mapsAPI) && $mapsAPI) {
  $maps_settings = $config->get("maps");
  $scripts->add('https://maps.googleapis.com/maps/api/js?v=3.17&amp;key='.($maps_settings['api_key']).'&amp;sensor=false&amp;libraries=places');
  $scripts->add('markerclusterer_compiled.js');
  $scripts->add('oms.js');
}

// TODO: Move to end of file for faster loading?
$scripts->add('bootstrap.min.js');

/* Deal with styles here, for now */
$styles = new WCAClasses\WCAStyles();
$styles->add('bootstrap.min.css');
$styles->add('navbar-static-top.css');
$styles->add('general.css');
$styles->add('pageMenu.css');
$styles->add('tables.css');
$styles->add('links.css');
if(isset($is_admin) && $is_admin) {
  $styles->add('admin.css');
}

if(isset($jQuery_chosen) && $jQuery_chosen) {
  $scripts->add('selectize.min.js');
  $scripts->add('selectize_field.js');
  $styles->add('selectize.default.css');
}


// print html
print $scripts->getHTMLAll();
print $styles->getHTMLAll();

?>


<?php print isset( $extraHeaderStuff ) ? $extraHeaderStuff : ''; ?>
</head>

<body>


    <!-- Static navbar -->
    <div class="navbar navbar-default navbar-static-top" role="navigation">
      <div class="container">
        <div class="navbar-brand">
          <a href="/"><img src="<?php print pathToRoot(); ?>images/wca_logo.svg"/></a>
          <a href="/"><span>World Cube Association</span></a></div>
        <div class="navbar-header">
          <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
        </div>
        <div class="navbar-collapse collapse disabled">
          <ul class="nav navbar-nav">
            <li class="dropdown">
              <a href="/" class="dropdown-toggle top-nav" data-toggle="dropdown">Information <span class="caret"></span></a>
              <ul class="dropdown-menu" role="menu">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About the WCA</a></li>
                <li><a href="/delegates">WCA Delegates</a></li>
                <li><a href="/organisations">National Organisations</a></li>
                <li><a href="/contact">Contact Information</a></li>
                <li><a href="/score-tools">Score Tools</a></li>
                <li><a href="/logo">Logo</a></li>
              </ul>
            </li>
            <li class="dropdown active">
              <a href="/results/" class="dropdown-toggle top-nav" data-toggle="dropdown">Competitions <span class="caret"></span></a>
              <ul class="dropdown-menu" role="menu">
                <li><a href="/results/competitions.php">Competitions</a></li>
                <li><a href="/results/events.php">Rankings</a></li>
                <li><a href="/results/regions.php">Records</a></li>
                <li><a href="/results/persons.php">Persons</a></li>
                <li class="divider"></li>
                <li><a href="/results/statistics.php">Statistics</a></li>
                <li><a href="/results/media.php">Multimedia</a></li>
                <li><a href="/results/misc.php">Miscellaneous</a></li>
                <li><a href="/results/misc/export.html">Database Export</a></li>
              </ul>
            </li>
            <li class="dropdown">
              <a href="/regulations/" class="dropdown-toggle top-nav" data-toggle="dropdown">Regulations <span class="caret"></span></a>
              <ul class="dropdown-menu" role="menu">
                <li><a href="/regulations/">Regulations</a></li>
                <li><a href="/regulations/guidelines.html">Guidelines</a></li>
                <li><a href="/regulations/scrambles/">Scrambles</a></li>
                <li class="divider"></li>
                <li><a href="/regulations/announcements/">Announcements</a></li>
                <li><a href="/regulations/history/">History</a></li>
                <li><a href="/regulations/translations/">Translations</a></li>
              </ul>
            </li>
            <li><a href="/forum/" class="top-nav">Forum</a></li>
          </ul>
        </div><!--/.nav-collapse -->
      </div>
    </div>

<?php if (!$standAlone) { ?>
<div id="main">
<div id="content" class="container">
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

  // "Remember" administrators - try to make this link persistent if people have visited an admin page.
  // (see _session.php file for implementation)
  if ($is_admin) {
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
<!-- TODO: Remove or reappropriate for Bootstrap.
<div id="pageMenuFrame">
  <div id="pageMenu">
    <ul class="navigation">
      <?php print_menu($sections, $currentSection); ?>
    </ul>
  </div>
</div>

<div id='header'><a href='https://www.worldcubeassociation.org/'>World Cube Association<br />Official Results</a></div>
<?php } ?>
 -->
<?php startTimer(); ?>
