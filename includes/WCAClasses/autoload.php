<?php
namespace WCAClasses;

function wcaLoad($class) {
  $file = dirname(__DIR__) . '/' . str_replace("\\", DIRECTORY_SEPARATOR, $class) . ".class.php";
  if(is_file($file) && file_exists($file)) {
    require_once($file);
  }
}
// autoload WCA classes - assume namespace structure is same as directory structure
spl_autoload_register("WCAClasses\wcaLoad");
