<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

<? require( '_framework.php' ); ?>
<? $standAlone = getBooleanParam( 'standAlone' ); ?>

<head>
<title>World Cube Association - Official Results</title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<meta name="author" content="Stefan Pochmann, Josef Jelinek" />
<meta name="description" content="Official World Cube Association Competition Results" />
<meta name="keywords" content="rubik's cube,puzzles,competition,official results,statistics,WCA" />
<link rel="shortcut icon" href="images/wca.ico" />
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
    array( 'Home',         '../index'     ),
    array( 'Results',      'index'        ),
    array( 'Events',       'events'       ),
    array( 'Regions',      'regions'      ),
    array( 'Competitions', 'competitions' ),
    array( 'Persons',      'persons'      ),
    array( 'Multimedia',   'media'        ),
    array( 'Statistics',   'statistics'   )
  );
?>

<div id="pageMenuFrame">
  <div id="pageMenu">
    <table summary="This table gives other relevant links" cellspacing="0" cellpadding="0"><tr>
<? foreach( $sections as $section ){
    $name   = $section[0];
    $id     = $section[1];
    $active = ($id == $currentSection) ? 'id="activePage"' : ''; ?>
<td><div class="item"><a href="<?= pathToRoot() . $id ?>.php" <?= $active ?>><?= $name ?></a></div></td>
<? } ?>
    </tr></table>
  </div>
</div>

<div id='header'>World Cube Association<br />Official Results</div>
<? } ?>

<? startTimer() ?>
