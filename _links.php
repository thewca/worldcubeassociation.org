<?

function competitionLink ( $id, $name ) {
  return competitionLinkClassed( 'c', $id, $name );
}

function competitionLinkClassed ( $class, $id, $name ) {
  $name = htmlEntities( $name, ENT_QUOTES, "UTF-8" );
  return "<a class='$class' href='" . pathToRoot() . "c.php?i=$id'>$name</a>";
}

function personLink ( $id, $name ) {
  $name = htmlEntities( $name, ENT_QUOTES, "UTF-8" );
  $name = preg_replace( '/\((.*)\)$/', '<span>($1)</span>', $name );
  return "<a class='p' href='" . pathToRoot() . "p.php?i=$id'>$name</a>";
}

function eventLink ( $id, $name ) {
#  $name = htmlEntities( $name );  # careful: can't do that because of multibld on person page in personal records table
  return "<a class='e' href='" . pathToRoot() . "e.php?i=$id'>$name</a>";
}

function eventAverageLink ( $id, $name ) {
  $name = htmlEntities( $name, ENT_QUOTES, "UTF-8" );
  return "<a class='e' href='" . pathToRoot() . "e.php?i=$id&amp;average=1'>$name</a>";
}

function internalEventLink ( $href, $name ) {
  $name = htmlEntities( $name, ENT_QUOTES, "UTF-8" );
  return "<a class='internalEvent' href='$href'>$name</a>";
}

function emptyLink ( $text ) {
  return "<span class='emptyLink'>$text</span>";
}

#----------------------------------------------------------------------

function externalLink ( $url, $text ) {
  if( ! $url )
    return emptyLink( $text );

  $url = htmlEscape( $url );

  list( $firstWord, $rest) = preg_split( '/\s/', $text, 2 );
  if( $rest )
    $rest = " $rest";

  $firstWord = htmlEscape( $firstWord );
  $rest = htmlEscape( $rest );

  return " <a class='external' href='$url'><span style='white-space:nowrap'><img src='" . pathToRoot() . "images/external_link.png' alt='external link' />$firstWord</span>$rest</a>";

#  return $url
#    ? " <img src='" . pathToRoot() . "images/external_link.png' /><a class='external' target='_blank' href='$url'>$text</a>"
#    : emptyLink( $text );
}

#----------------------------------------------------------------------

function emailLink ( $address, $text ) {
  if( ! $address )
    return emptyLink( $text );

  list( $firstWord, $rest) = preg_split( '/\s/', $text, 2 );
  if( $rest )
    $rest = " $rest";

  return " <a class='email' href='mailto:$address'><span style='white-space:nowrap'><img src='" . pathToRoot() . "images/email_link.png' alt='email link' />$firstWord</span>$rest</a>";

#  return $address
#    ? " <img src='" . pathToRoot() . "images/email_link.png' /><a class='email' href='mailto:$address'>$text</a>"
#    : emptyLink( $text );
}

#----------------------------------------------------------------------

function processLinks ( $text ) {
  return preg_replace( '/\[{ ([^}]+) }{ ([^}]+) }]/xe', 'processLink( "$1", "$2" )', $text );
}

function processLink ( $text, $link ) {
  $text = preg_replace( '/\\\\([\'\"])/', '$1', $text );
  $link = preg_replace( '/\\\\([\'\"])/', '$1', $link );
  if( preg_match( '/^mailto:(.*)$/', $link, $match )) return emailLink( $match[1], $text );
  if( preg_match( '/^http:(.*)$/',   $link, $match )) return externalLink( $link, $text );
  return emptyLink( '[{' . $text . '}{' . $link . '}]' );
}

?>
