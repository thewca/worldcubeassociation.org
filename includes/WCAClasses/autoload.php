<?php
namespace WCAClasses;

function Load($class) {
  $file = dirname(__DIR__) . '/' . str_replace("\\", DIRECTORY_SEPARATOR, $class) . ".class.php";
  if(is_file($file) && file_exists($file)) {
    require_once($file);
  } else {
    print '<p>Class <pre>' . $class . '</pre> not loaded - could not include ' . $file . '.</p>';
    print '<p>Working in directory: ' . dirname(__DIR__) .'</p>';
  }
}
// autoload WCA classes - assume namespace structure is same as directory structure
spl_autoload_register("WCAClasses\Load");

