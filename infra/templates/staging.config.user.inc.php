<?php


/* Servers configuration */
$i = 0;

/* Server: Primary Database [0] */
$i++;
$cfg['Servers'][$i]['verbose'] = '';
$cfg['Servers'][$i]['port'] = '';
$cfg['Servers'][$i]['host'] = 'staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com;
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['auth_type'] = 'cookie';
// The RDS IAM Authentication requires SSL
$cfg['Servers'][$i]['ssl'] = true;
// You need to have the region CA file and the authority CA file in the PEM bundle for it to work
$cfg['Servers'][$i]['ssl_ca'] = '/etc/phpmyadmin/rds_ca.pem';
// Enable SSL verification
$cfg['Servers'][$i]['ssl_verify'] = true;

/* Server: Read Replica [1] */
$i++;
$cfg['Servers'][$i]['verbose'] = '';
$cfg['Servers'][$i]['port'] = '';
$cfg['Servers'][$i]['host'] = 'readonly-staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com';
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['auth_type'] = 'cookie';
// The RDS IAM Authentication requires SSL
$cfg['Servers'][$i]['ssl'] = true;
// You need to have the region CA file and the authority CA file in the PEM bundle for it to work
$cfg['Servers'][$i]['ssl_ca'] = '/etc/phpmyadmin/rds_ca.pem';
// Enable SSL verification
$cfg['Servers'][$i]['ssl_verify'] = true;

/* End of servers configuration */

$cfg['DefaultLang'] = 'en';
$cfg['ServerDefault'] = 1;
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';
?>
