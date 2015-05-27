# Chef / Tarsnap

[![Build Status](https://travis-ci.org/jssjr/chef-tarsnap.png?branch=master)](https://travis-ci.org/jssjr/chef-tarsnap)
[![Code Climate](https://codeclimate.com/github/jssjr/chef-tarsnap.png)](https://codeclimate.com/github/jssjr/chef-tarsnap)
[![Gem Version](https://badge.fury.io/rb/knife-tarsnap.png)](http://badge.fury.io/rb/knife-tarsnap)
[![Dependency Status](https://gemnasium.com/jssjr/chef-tarsnap.png)](https://gemnasium.com/jssjr/chef-tarsnap)

Provides a chef cookbook with LWRP's to take directory snapshots and maintain retention schedules. Includes a knife plugin for managing tarsnap keys, listing backups, and restoring files.

Backup services are handled by [Colin Percival](https://twitter.com/cperciva)'s excellent [tarsnap](https://www.tarsnap.com/).


## Installation

### Cookbook Installation

Install the cookbook using knife:

    $ knife cookbook install tarsnap

Or install the cookbook from github:

    $ git clone git://github.com/jssjr/chef-tarsnap.git cookbooks/tarsnap
    $ rm -rf cookbooks/tarsnap/.git

Or use the [knife-github-cookbooks](https://github.com/websterclay/knife-github-cookbooks) plugin:

    $ knife cookbook github install jssjr/chef-tarsnap


### Knife Plugin Installation

Add this line to your application's Gemfile:

    gem 'knife-tarsnap'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install knife-tarsnap

Alternatively, add this line to your application's Gemfile:

    gem 'knife-tarsnap', :path => 'cookbooks/tarsnap/knife-tarsnap'

And then execute:

    $ bundle


## Usage

### Backing up node data

Create a recipe to define your tarsnap resources, like this:

```ruby
# my-app::backups

include_recipe 'tarsnap'

tarsnap_backup 'app-data' do
  path '/opt/my_app/data'
  exclude '/opt/my_app/data/bin'
  schedule 'hourly'
end

tarsnap_backup 'etc-data' do
  path [ '/etc', '/usr/local/etc' ]
  schedule 'daily'
end
```

The tarsnap LWRP will create an archive for each resource and will maintain a set of snapshots according to the schedule.

You can use the default by including the `tarsnap::default_schedule` recipe or define your own. See the documentation for scheduling at [danrue/feather](https://github.com/danrue/feather) for more information on the rotation behavior. The default schedule is below:

```ruby
tarsnap_schedule "monthly" do
  period 2592000 # 30 days
  always_keep 12
  before "0600"
end

tarsnap_schedule "weekly" do
  period 604800 # 7 days
  always_keep 6
  after "0200"
  before "0600"
  implies "monthly"
end

tarsnap_schedule "daily" do
  period 86400 # 1 day
  always_keep 14
  after "0200"
  before "0600"
  implies "weekly"
end

tarsnap_schedule "hourly" do
  period 3600 # 1 hour
  always_keep 24
  implies "daily"
end

tarsnap_schedule "realtime" do
  period 900 # 15 minutes
  always_keep 10
  implies "hourly"
end
```


### Tarsnap keys

Tarsnap keys are stored on the chef server in an encrypted data bag. When the tarsnap::default recipe is included in a node's run list, it will call the tarsnap_key LWRP and attempt to create the /root/tarsnap.key file. If the key is not found in the tarsnap keys data bag, then the LWRP will create a placeholder data bag item indicating the key needs to be created. The tarsnap knife plugin provides tasks to simplify key management.

The format of the encrypted data bag item is:

```json
{
  "id": "hostname_domain_tld",
  "node": "hostname.domain.tld",
  "key": "# START OF TARSNAP KEY FILE\ndGFyc25hcAAAAAAA..."
}
```


### Configuring the tarsnap knife plugin

> **NOTE** This plugin requires you to have tarsnap installed! Please see [https://www.tarsnap.com/download.html](https://www.tarsnap.com/download.html) for sources, or ask your favorite operating system's package manager.

> **NOTE** Tarsnap requires an account at [tarsnap.com](http://tarsnap.com) to work. The service is frighteningly secure, lightweight, and very inexpensive.

You can provide the required options for the knife plugin on the command line, or you can set them in your knife.rb file.

* **Username**

  command line: `-A` or `--tarsnap-username`

  knife.rb: `knife[:tarsnap_username] = "root@example.com"`

* **Password** (By default, knife will prompt for the password if required.)

  command line: `-K` or `--tarsnap-password`

  knife.rb: `knife[:tarsnap_password] = "supersecret" # Bad idea!`

* **Data Bag** (By default, the keys data bag is `tarsnap_keys`)

  command line: `-B` or `--tarsnap-data-bag`

  knife.rb: `knife[:tarsnap_data_bag] = "tarsnap_keys"`


### Managing keys with the knife plugin

#### $ knife tarsnap key list (options)

Lists all known and pending tarsnap keys.

#### $ knife tarsnap key create NODE (options)

Creates the tarsnap key for a node, and removes the placeholder data bag item so the node is no longer considered pending. This command will prompt for your Tarsnap password if it isn't provided as an option or in your knife.rb config file.

#### $ knife tarsnap key from file KEYFILE NODE (options)

Create the tarsnap key for a node by reading the key contents from a file.

#### $ knife tarsnap key show NODE (options)

Output the decrypted tarsnap key for a node.

#### $ knife tarsnap key export (options)

Export all keys into a local directory named ./tarsnap-keys-TIMESTAMP. Override the directory with the `-D DIRNAME` option.


### Managing backups with the knife plugin

#### $ knife tarsnap backup show NODE \[ARCHIVE\] (options)

Show all of the archives that tarsnap has for a node. If the archive name is provided, then list the filenames in the archive.

Example:

    $ knife tarsnap backup show ip-10-72-206-146.ec2.internal                                                                                                                                     <<<
    etc-201304070526UTC-daily
    etc-201304070526UTC-hourly
    etc-201304070526UTC-monthly
    etc-201304070526UTC-realtime
    etc-201304070526UTC-weekly
    etc-201304070545UTC-realtime

Example:

    $ knife tarsnap backup show ip-10-72-206-146.ec2.internal etc-201304070526UTC-daily | head
    etc/
    etc/.pwd.lock
    etc/X11/
    etc/X11/xkb/
    etc/acpi/
    etc/acpi/events/
    etc/acpi/events/powerbtn
    etc/acpi/powerbtn.sh
    etc/adduser.conf

#### $ knife tarsnap backup download NODE ARCHIVE (options)

Download an archive tarball from the tarsnap server.

#### $ knife tarsnap backup dump NODE ARCHIVE PATTERN (options)

Dump the contents of files in an archive that match the provided pattern to standard output. This is similar to using the tar command with an inclusion pattern. Use the `-D DIRECTORY` option to retrieve the matching files into a local directory instead.

Example:

    $ knife tarsnap backup dump ip-10-72-206-146.ec2.internal etc-201304070526UTC-daily 'etc/adduser.conf' | head
    # /etc/adduser.conf: `adduser' configuration.
    # See adduser(8) and adduser.conf(5) for full documentation.
    
    # The DSHELL variable specifies the default login shell on your
    # system.
    DSHELL=/bin/bash
    
    # The DHOME variable specifies the directory containing users' home
    # directories.
    DHOME=/home


## Warning!

You need to keep a copy of your keys somewhere safe. If you lose them, then it is **impossible** to recover anything from your tarsnap backups. The chef server provides a convenient storage system for this data through data bags, however I strongly suggest storing redundant copies of the keys in multiple locations.


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

Author:: Scott Sanders (scott@jssjr.com)

Author:: Greg Fitzgerald (greg@gregf.org)

Copyright:: Copyright (c) 2013 Scott Sanders

License:: Apache License, Version 2.0

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
