<?
#----------------------------------------------------------------------
#
#   This script specifies which lists shall be shown on the statistics
#   page and in what order.
#
#   If you want to add a ist, write a file like the others and include
#   it on the bottom of this script.
# 
#   Each list definition appends to $lists an array of four values:
# 
#     - Title
#     - Subtitle
#     - Column definition
#     - Query
#
#   The column definition must reflect the query results. Each column
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

importAllLists();

#----------------------------------------------------------------------
function importAllLists () {
#----------------------------------------------------------------------
  global $lists;
  global $WHERE, $sinceDateHtml, $sinceDateMysql, $sinceDateCondition;

  #--- You can test a single statistic like this:
  #require( 'statistics/333_consecutive_sub20.php' );
  #return;

  #--- Special ranks:
  require( 'statistics/youngest_and_oldest_333_solvers.php');
  require( 'statistics/youngest_and_oldest_333bf_solvers.php');
  require( 'statistics/best_medal_collection.php' );
  require( 'statistics/sum_of_345_ranks.php' );
  require( 'statistics/sum_of_all_ranks.php' );
  require( 'statistics/appearances_in_333_top_100_results.php' );

  #--- Special achievements:
  require( 'statistics/blindfold_333_consecutive_successes.php' );
  require( 'statistics/blindfold_333_success_rate.php' );
  require( 'statistics/world_records_in_most_events.php' );
  require( 'statistics/standard_deviation.php' );

  #--- Statistics:
  require( 'statistics/best_podium.php' );
  require( 'statistics/oldest_standing_world_records.php' );
  require( 'statistics/most_persons.php' );
  require( 'statistics/most_competitions.php' );
  require( 'statistics/most_countries.php' );
  require( 'statistics/most_solves_attempts_in_one_competition.php' );
}

?>
