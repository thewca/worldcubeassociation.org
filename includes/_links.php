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
  return $url ? _linkWithImage( htmlEscape( $url ), $text, 'external' )
              : emptyLink( $text );
}

#----------------------------------------------------------------------

function emailLink ( $address, $text ) {
  return $address ? _linkWithImage( "mailto:$address", $text, 'email' )
                  : emptyLink( $text );
}

#----------------------------------------------------------------------

function _linkWithImage ( $href, $text, $class ) {
  $img = "<img src='" . pathToRoot() . "images/{$class}_link.png' alt='$class link' />";

  $splitText = preg_split( '/\s/', $text, 2 );
  $firstWord = htmlEscape( $splitText[0] );
  $rest      = count( $splitText ) > 1 ? " ".htmlEscape( $splitText[1] ) : "";

  return " <a class='$class' href='$href'><span style='white-space:nowrap'>$img$firstWord</span>$rest</a>";
}

#----------------------------------------------------------------------

function processLinks ( $text ) {
  return preg_replace( '/\[{ ([^}]+) }{ ([^}]+) }]/xe', 'processLink( "$1", "$2" )', $text );
}

function processLink ( $text, $link ) {
  $text = preg_replace( '/\\\\([\'\"])/', '$1', $text );
  $link = preg_replace( '/\\\\([\'\"])/', '$1', $link );
  if( preg_match( '/^mailto:(.*)$/', $link, $match )) return emailLink( $match[1], $text );
  if( preg_match( '/^https?:(.*)$/',   $link, $match )) return externalLink( $link, $text );
  return emptyLink( '[{' . $text . '}{' . $link . '}]' );
}

?>
