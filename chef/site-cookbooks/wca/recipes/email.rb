secrets = WcaHelper.get_secrets(self)

node.default['exim4']['configtype'] = 'smarthost'

if node.chef_environment != "production"
  # Configuration for mailcatcher
  node.default['exim4']['smarthost_server'] = '127.0.0.1'
  node.default['exim4']['smarthost_port'] = '1025'
else
  # Configuration for Amazon SES. Inspired by
  # https://technpol.wordpress.com/2014/03/29/configuring-exim-for-amazon-mail-debian-exim4-and-aws-ses/
  node.default['exim4']['smarthost_server'] = 'email-smtp.us-west-2.amazonaws.com'
  node.default['exim4']['smarthost_port'] = '587'
  # Amazon will resolve to a different server name each time (via the load
  # balancer), so you can’t just put your smtp server name in here.
  node.default['exim4']['smarthost_auth_server'] = '*.amazonaws.com'
  node.default['exim4']['smarthost_login'] = secrets['SMTP_USERNAME']
  node.default['exim4']['smarthost_pwd'] = secrets['SMTP_PASSWORD']
end

node.default['exim4']['other_hostnames'] = node['fqdn']
node.default['exim4']['local_interfaces'] = '127.0.1.1' # make way for mailcatcher
node.default['exim4']['relay_domains'] = ''
node.default['exim4']['minimaldns'] = 'false'
node.default['exim4']['relay_nets'] = ''
node.default['exim4']['use_split_config'] = false
node.default['exim4']['hide_mailname'] = false
node.default['exim4']['localdelivery'] = 'maildir_home'

include_recipe "exim4-light"
