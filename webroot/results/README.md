# WCA results website

A little by-folder overview of our system.


## Public web access

### `/`
The PHP scripts for the public pages, currently also containing password-protected
access to competition organization/administration pages.

### `/images`
Just icons right now. Could be merged with `/style` maybe.

### `/js`
Some JavaScript files.

### `/misc`
For miscellaneous stuff like the public data export and the age-vs-speed statistic.

### `/style`
CSS and images.

### `/upload`
Currently only used for the uploaded competitor photos shown on their personal pages.


## Protected web access

### `/admin`
Tools for the results managing team. Protected with `.htaccess` and `.htpasswd` and requiring use of SSL.


## No web access

These folders are used internally by the above parts and use `.htaccess` to deny web access.

### `/dev`
Developer stuff, so far some tools Stefan uses and is working on. Denying web access for now.

### `/includes`
Our helper scripts that are only used internally by those accessible on the web.
Those starting with underscores like `_tables.php` are our general tool scripts,
the other ones like `events_results.php` have prefixes like `events_` telling
what they belong to. Also here is `_config.php.template`, a template for the `_config.php`
file necessary to run the server.

### `/includes/thirdparty`
Stuff like PHPExcel and reCAPTCHA. Where possible, we link to the repository
on GitHub (as "submodule" - to get it, type `git submodule init` and then
`git submodule update`).

### `/generated`
For stuff that is generated again and again (logs, precomputed stuff).
Collecting it in here to not clutter the root folder, deny web access,
and ignore using `.gitignore`.
