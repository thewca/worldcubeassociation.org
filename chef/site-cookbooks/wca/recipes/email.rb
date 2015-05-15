node.default['exim4']['configtype'] = 'internet'
node.default['exim4']['use_split_config'] = false
include_recipe "exim4-light"
