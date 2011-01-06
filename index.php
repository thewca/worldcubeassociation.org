<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'index';

require( '_header.php' );
showWelcomeMessage();
require( '_footer.php' );

#----------------------------------------------------------------------
function showWelcomeMessage () {
#----------------------------------------------------------------------

?><div style="width:85%; margin: auto; font-size: 1.3em">

<p>Welcome to the WCA result pages!</p>

<p>Here you can find all results of official WCA competitions, arranged by these major views:</p>

<dl>
  <dt><a href="events.php">Rankings</a></dt>
  <dd>Rubik's Cube records, Megaminx records, 5x5x5 blindfolded records, ...</dd>

  <dt><a href="regions.php">Records</a></dt>
  <dd>World records, European records, Canadian records, ...</dd>

  <dt><a href="competitions.php">Competitions</a></dt>
  <dd>Information and results of a competition.</dd>

  <dt><a href="persons.php">Persons</a></dt>
  <dd>Information and results of a person.</dd>

  <dt><a href="media.php">Multimedia</a></dt>
  <dd>Articles, Videos, Pictures and Reports about competitions.</dd>

  <dt><a href="statistics.php">Statistics</a></dt>
  <dd>Some additional statistics for fun.</dd>

</dl>
</div>
<div>
<br />
<br />
The WCA result pages are designed and built by <?= externalLink( 'http://www.rubikscube.info/', 'Josef Jelinek' ) ?>, <?= externalLink( 'http://www.stefan-pochmann.info/', 'Stefan Pochmann' ) ?> and <?= externalLink( 'http://www.worldcubeassociation.org/results/p.php?i=2004GALL02', 'Clément Gallet' ) ?>.<br />
We would like to thank them for their great work for the cubing community.<br />
<br />
If you have questions about the rankings or if you want to correct something, then please contact <a href="mailto:rbruchem@worldcubeassociation.org">Ron van Bruchem</a>.
</div>

<?



}

?>
