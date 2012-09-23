<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

<? require_once( '_framework.php' ); ?>
<? $standAlone = getBooleanParam( 'standAlone' ); ?>

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

</head>
<body>
<? if( ! $standAlone ){ ?>
<div id="main">
<div id="content">

<?
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
  if ( $currentSection == 'admin' )
    $sections[] = array( 'Admin', 'admin', 'admin/' );

  if ( ! preg_match( '/worldcubeassociation.org$/', $_SERVER["SERVER_NAME"] ) )
    noticeBox3( 0, "Note: This is only a copy of the WCA results system used for testing stuff. The official WCA results are at:<br /><a href='http://www.worldcubeassociation.org/results/'>http://www.worldcubeassociation.org/results/</a>" );
?>

<div id="pageMenuFrame">
  <div id="pageMenu">
    <table summary="This table gives other relevant links" cellspacing="0" cellpadding="0"><tr>
<? foreach( $sections as $section ){
     $name   = $section[0];
     $active = ($section[1] == $currentSection) ? 'id="activePage"' : '';
     $href   = pathToRoot() . (isset($section[2]) ? $section[2] : $section[1].'.php');
     echo "<td><div class='item'><a href='$href' $active>$name</a></div></td>";
   } ?>
    </tr></table>
  </div>
</div>

<div id='header'>World Cube Association<br />Official Results</div>
<? } ?>

<? startTimer() ?>
