<?
#----------------------------------------------------------------------
#   This module handles all incoming parameters. First it does is
#   hide them all in a variable no other script should use (somewhat
#   enforced by a ridiculously long and self-explanatory name).
# 
#   The scripts can then get the parameters through the functions
#   below. Examples demonstrating the naming conventions and result
#   values follow:
#
#     $chosenFoo = getBooleanParam( 'foo' );
#       -> [01]
#
#     $chosenFoo = getNormalParam( 'foo' );
#       -> [A-Za-z0-9_ ]*
#
#     $chosenFoo = getNormalParamDefault( 'foo', 'ANYTHING' );
#       -> [A-Za-z0-9_ ]*
# 
#     $chosenFooHtml  = getHtmlParam( 'foo' );
#       -> html-safe string
#
#     $chosenFooMysql = getMysqlParam( 'foo' );
#       -> mysql-safe string
#
#   Notice foo is an arbitrary word, Foo is that word capitalized,
#   ANYTHING is an arbitrary string. The prefix 'chosen' and the
#   suffices 'Html' and 'Mysql' are our conventions and must be
#   followed to emphasize the meaning!
# 
#   An html-string must only be used in printing the HTML output.
# 
#   A mysql-string must only be used in an SQL query, and must be
#   enclosed in quotes.
#
#   Besides being useful, all this ensures we're safe against
#   people trying to crack us with filthy parameters.
#----------------------------------------------------------------------

// Is magic quotes on?
if( get_magic_quotes_gpc() ){
  // Yes? Strip the added slashes
  $_REQUEST = array_map( 'stripslashes', $_REQUEST );
  $_GET = array_map( 'stripslashes', $_GET );
  $_POST = array_map( 'stripslashes', $_POST );
  $_COOKIE = array_map( 'stripslashes', $_COOKIE );
}

$rawParametersDontUseOutsideParametersModule = $_REQUEST;
$_GET = $_POST = $_REQUEST = array();

#----------------------------------------------------------------------
function getBooleanParam ( $name ) {
#----------------------------------------------------------------------

  $value = getRawParamThisShouldBeAnException( $name ) ? 1 : 0;
  debugParameter( 'bool', $name, $value );
  return $value;
}

#----------------------------------------------------------------------
function getNormalParam ( $name ) {
#----------------------------------------------------------------------
  return getNormalParamDefault( $name, '' );
}

#----------------------------------------------------------------------
function getNormalParamDefault ( $name, $default ) {
#----------------------------------------------------------------------

  $value = urlDecode( getRawParamThisShouldBeAnException( $name ));
  if( ! preg_match( "/^(\w| )+$/", $value ))
    $value = $default;
  if( ! preg_match( "/^(\w| )*$/", $value ))
    $value = '';
  debugParameter( 'normal', $name, $value );
  return $value;
}

#----------------------------------------------------------------------
function getHtmlParam ( $name ) {
#----------------------------------------------------------------------

  $value = urlDecode( getRawParamThisShouldBeAnException( $name ));
  $value = htmlEntities( $value, ENT_QUOTES, "UTF-8" );
  debugParameter( 'html', $name, $value );
  return $value;
}

#----------------------------------------------------------------------
function getMysqlParam ( $name ) {
#----------------------------------------------------------------------

  $value = urlDecode( getRawParamThisShouldBeAnException( $name ));
  $value = mysql_real_escape_string( $value );
  debugParameter( 'mysql', $name, htmlEntities( $value, ENT_QUOTES ));
  return $value;
}

#----------------------------------------------------------------------
function getRawParamThisShouldBeAnException ( $name ) {
#----------------------------------------------------------------------
  global $rawParametersDontUseOutsideParametersModule;

  return $rawParametersDontUseOutsideParametersModule[$name];
}

#----------------------------------------------------------------------
function getRawParamsThisShouldBeAnException () {
#----------------------------------------------------------------------
  global $rawParametersDontUseOutsideParametersModule;

  return $rawParametersDontUseOutsideParametersModule;
}

#----------------------------------------------------------------------
function debugParameter( $type, $name, $value ) {
#----------------------------------------------------------------------
  if( debug() )
    echo "parameter($type) <b>[</b>$name<b>]</b> = <b>[</b>$value<b>]</b><br />\n";
}

#----------------------------------------------------------------------
function debug () {
#----------------------------------------------------------------------

  return getRawParamThisShouldBeAnException( 'debug5926' );
}

?>
