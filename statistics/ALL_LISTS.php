<?
#----------------------------------------------------------------------
#
#   This script specifies which lists shall be shown on the statistics
#   page and in what order.
#
#   If you want to add a ist, write a file like the others and include
#   it in the list in this script.
# 
#   Each list definition appends to $lists an array with these values:
# 
#     - Id (used as html anchor)
#     - Title (for the top-list and shown in brown-red above the stat)
#     - Subtitle (shown in gray)
#     - Column definitions (see description below)
#     - Rows (the actual data to show)
#     - Info (optional, provides longer explanation on yellow "info")
#
#   The column definitions must reflect the query results. Each column
#   is defined as "[type] name" with these possible types:
# 
#     [P] Person.      For person ids.
#     [E] Event.       For event ids.
#     [C] Competition. For competition ids.
#     [t] Text.        Just any text.
#     [n] Number.      For numbers.
#     [r] Result.      For result values. The query must also provide
#                      an event id for this to work because I need to
#                      get the value format.
# 
#   Moreover, types [T], [N] and [R] are bold versions of their lower
#   case versions and should be used for important values while the
#   lower case versions should be used for auxiliary values.
#
#----------------------------------------------------------------------

#--- Specify the statistics
$statisticNames = array(

  #--- Special ranks:
  'youngest_and_oldest_solvers',
  'best_medal_collection',
  'sum_of_ranks',
  'appearances_in_333_top_100_results',
  'sub_x',

  #--- Special achievements:
  'blindfold_333_consecutive_successes',
  'blindfold_333_success_rate',
  'world_records_in_most_events',

  #--- Statistics:
  'best_podium',
  'oldest_standing_world_records',
  'most_persons',
  'most_competitions',
  'most_countries',
  'most_solves_in_one_competition_or_year'

);

#--- You can test a single statistic by overwriting the list like this:
#$statisticNames = array( 'blindfold_333_success_rate' );
  
foreach ( $statisticNames as $statisticName )
  addOneStatistic( $statisticName );


#----------------------------------------------------------------------
function addOneStatistic ( $statisticName ) {
#----------------------------------------------------------------------
  global $lists;
  global $WHERE, $sinceDateHtml, $sinceDateMysql, $sinceDateCondition;
  
  startTimer();
  require( "statistics/$statisticName.php" );
  stopTimer( "STATISTIC: $statisticName" );
}

?>
