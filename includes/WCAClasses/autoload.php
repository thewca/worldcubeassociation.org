<?php
namespace WCAClasses;

function Load($class) {
  $file = __DIR__ . "/../" . str_replace("\\", DIRECTORY_SEPARATOR, $class) . ".class.php";
  if(is_file($file) && file_exists($file)) {
    require_once($file);
  } else {
    print "<p>Class <pre>" . $class . "</pre> not loaded - could not include " . $file . ".";
  }
}
// autoload WCA classes - assume namespace structure is same as directory structure
spl_autoload_register("WCAClasses\Load");

