secrets = WcaHelper.get_secrets(self)

if node.chef_environment == "production" || node.chef_environment == "staging"
  node.default['newrelic-sysmond']['license_key'] = secrets['NEW_RELIC_LICENSE_KEY']
  include_recipe "newrelic-sysmond"
end
