<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
adminHeadline( 'Documentation' );
showDescription();
showBody();
require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>Some documentation of our system.</p>\n";

  echo "<hr />\n";
}

#----------------------------------------------------------------------
function showBody () {
#----------------------------------------------------------------------

  $src = bodySource();
  $src = preg_replace( '/\\[(\w+)\\]/', '<span style="font-weight:bold; color:#00F">$1</span>', $src );
  $src = preg_replace( '/\n/', '<br />', $src );
  echo "<p style='width:45em'>$src</p>";
}

#----------------------------------------------------------------------
function bodySource () {
#----------------------------------------------------------------------

  $data = <<<EOF
[Results] is the main table. One row contains the results of one person in one round of one event at one competition, for example Ron's results in first round of 3x3x3 at WC2009.

[Competitions], [Events] and [Persons] provide more details like name, country and (birth)date.

[Countries], [Continents], [Formats], [Rounds] mainly list what's available.

[ConciseSingleResults], [ConciseAverageResults], [RanksSingle] and [RanksAverage] are helper tables computed from the main data, making queries faster.

[Preregs] is for our preregistration system, one row for one person at one competition.

[CompetitionsMedia] is for links to articles/reports/video/etc about competitions.

[ResultsStatus] holds system status values, currently only the database migration version.
EOF;
  return trim( $data );
}