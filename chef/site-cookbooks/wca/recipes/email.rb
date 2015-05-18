node.default['exim4']['configtype'] = 'internet'
node.default['exim4']['use_split_config'] = false
node.default['exim4']['local_interfaces'] = ''
include_recipe "exim4-light"
