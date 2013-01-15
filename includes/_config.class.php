<?php
/* @file
 * 
 * This file contains a class which can be used for accessing configuration settings.
 * 
 */

/*
 * @var configurationData
 *
 * Available methods:
 *  - get($val): returns a stored setting value.
 *
 */
class configurationData
{
    // For now, data is just an array containing configuration settings.
    protected $data = NULL;

    public function __construct()
    {
        // this directory
        $includes_directory = dirname(__file__);
        // expect an associated _config.php file (shouldn't be included anywhere else...)
        include($includes_directory . "/_config.php");

        // Validate security of install... not sure if this really belongs here
        if(!file_exists($includes_directory . '/../admin/.htaccess')) {
            exit( 'check your config file' );
        }

        if (!isset($config) || empty($config)) {
            trigger_error("Config settings not found!", E_USER_ERROR);
        }

        $this->data = $config;
    }

    public function get($value)
    {
        return $this->data[$value];
    }

}
