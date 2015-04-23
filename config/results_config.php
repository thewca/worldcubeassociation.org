<?php
// THIS FILE CAME FROM webroot/results/includes/_config.php.template
// data here is loaded into configuration class.  Should be accessed by via configuration object (global $config in _framework file).

$config['database']['host'] = 'localhost';
$config['database']['user'] = 'root';
$config['database']['pass'] = 'root';
$config['database']['name'] = 'cubing_results';

$config['recaptcha']['publickey'] = '...';
$config['recaptcha']['privatekey'] = '...';

$config['maps']['api_key'] = '';

// check for PEAR mail (to send auth email)
if(class_exists('Mail')) {
  $config['mail']['pear'] = true;
} else {
  $config['mail']['pear'] = false;
}

if($config['mail']['pear']) {
  $config['mail']['from'] = '';
  $config['mail']['host'] = '';
  $config['mail']['port'] = '';
  $config['mail']['user'] = '';
  $config['mail']['pass'] = '';
} else {
  $config['mail']['from'] = 'no-reply@worldcubeassociation.org';
}


// pathToRoot and filesPath are determined by config class - just a placeholder here.  You can enter an explicit value if desired.  Include trailing slash.
// pathToRoot is for web urls, etc.  May be different than filesystem paths.  Eg, "/results/".
$config['pathToRoot'] = "/results/";
// filesPath is absolute path for system files.  May be different than web urls.  Eg, "/var/www/results/".
$config['filesPath'] = "/vagrant/webroot/results/";
