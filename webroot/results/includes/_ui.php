<?php

/* UI-related things (display functions, notices, etc) can be included in here. */


/*
 * Shorthand for htmlentities.
 */
function o($value, $flags = ENT_QUOTES)
{
  return htmlentities($value, $flags, 'UTF-8', FALSE);
}

/* 'longhand?' */
function htmlEscape ( $string ) {
  return htmlentities( $string, ENT_QUOTES, "UTF-8" );
}

/* Misc. text modification */

function spaced ( $parts ) {
  return implode( str_repeat( '&nbsp;', 10 ), array_filter( $parts ));
}

function extractRomanName ( $name ) {
  if( preg_match( '/(.*)\((.*)\)$/', $name, $matches ))
    return( rtrim( $matches[1] ));
  else
    return( $name );
}

function extractLocalName ( $name ) {
  if( preg_match( '/(.*)\((.*)\)$/', $name, $matches ))
    return( $matches[2] );
  else
    return( '' );
}

function visualize ( $text ) {
  return preg_replace( '/\s/', '<span style="color:#F00">#</span>', $text );
}

function highlight ( $sql ) {
  $sql = preg_replace( '/(UPDATE|SET|WHERE|AND|REGEXP)/', '<b>$1</b>', $sql );
  $sql = preg_replace( '/(\\w+) = \?/', '<span style="color:#00C">$1</span> = <span style="color:#F00">?</span>', $sql );
  return $sql;
}


/* Notices boxes. */

function noticeBox($isSuccess, $message) {
  if($isSuccess) {
    noticeBox3(1, $message);
  } else {
    noticeBox3(-1, $message);
  }
}

function noticeBox2($isSuccess, $yesMessage, $noMessage) {
  if($isSuccess) {
    noticeBox($isSuccess, $yesMessage);
  } else {
    noticeBox($isSuccess, $noMessage);
  }
}

function noticeBox3($color, $message) {
  #--- Color: -1=red, 0=yellow, 1=green
  $colorBorder = array('failure', 'warning', 'success');
  $colorBorder = $colorBorder[$color+1];

  #--- Show the notice
  echo '<div class="notice '.$colorBorder.'">' . $message . '</div>';
}


/* Display system errors */

function showErrors($errors, $message = "Uh-oh!  The following errors were encountered:") {
  if(!empty($errors)) {
    $message = '<p>' . $message . '</p>';
    $message .= '<ul>';
    foreach($errors as $error) {
        $message .= '<li>' . $error . '</li>';
    }
    $message .= '</ul>';
    noticeBox(FALSE, $message);
  }
}


/* More messages? */

function assertFoo($check, $message) {
  if(!$check) {
    showErrorMessage($message);
  }
}

function showErrorMessage($message) {
  print '<div class="errorMessage">Error: ' . $message . '</div>';
}


/* Display 'code' */

function pretty($object) {
  print '<pre>';
  print_r($object);
  print '</pre>';
}


/* Breadcrumbs in admin section */

function adminHeadline($title, $scriptIfExecution = false) {
  if($scriptIfExecution) {
    $crumb = '<a href="' . $scriptIfExecution . '.php?forceReload='.time().'">'.$title.'</a> &gt;&gt; <strong>Execution</strong>';
  } else {
    $crumb = '<strong>' . $title . '</strong>';
  }

  print '<div class="adminHeadline">'
        . '<a href="' . pathToRoot() . 'admin/">Administration</a> &gt;&gt; '
        . $crumb
        . ' &nbsp;(' . wcaDate() . ')</div>';
}
