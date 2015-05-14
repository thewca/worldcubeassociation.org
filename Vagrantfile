vagrant_plugins = %w(vagrant-librarian-chef-nochef vagrant-triggers vagrant-digitalocean).select {
                    |plugin| !Vagrant.has_plugin?(plugin) }
vagrant_plugins.each do |plugin|
  # Attempt to install plugin.
  # Bail out on failure so we don't get stuck in an infinite loop.
  system("vagrant plugin install #{plugin}") || exit!
end
unless vagrant_plugins.empty?
  # Relaunch Vagrant so the new plugin(s) are detected.
  # Exit with the same status code.
  exit system('vagrant', *ARGV)
end

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network :forwarded_port, host: 8080, guest: 80
  config.ssh.forward_agent = true
  config.vm.synced_folder "secrets/", "/secrets"

  config.vm.provider "virtualbox" do |vb|
    # The results scripts can be a bit of a hog.
    vb.memory = 2048
  end

  config.vm.provider :digital_ocean do |provider, override|
    override.ssh.private_key_path = '~/.ssh/id_rsa'
    override.vm.box = 'digital_ocean'
    override.vm.box_url = "https://github.com/smdahlen/vagrant-digitalocean/raw/master/box/digital_ocean.box"
    # The /vagrant directory is only useful for development, and can grow quite large,
    # so it's not worth rsyncing it when provisioning.
    override.vm.synced_folder '.', '/vagrant', disabled: true

    provider.token = ENV['DIGITAL_OCEAN_API_KEY']
    provider.image = 'ubuntu-14-04-x64'
    provider.region = 'sfo1'
    provider.size = '512mb'
    provider.setup = false
  end

  environments = %w(dev staging production)
  config.librarian_chef.cheffile_dir = "chef"
  environments.each do |environment|
    config.vm.define environment, autostart: false do |sub_config|
      sub_config.vm.hostname = "wca-#{environment}"
      sub_config.vm.provision "chef_zero" do |chef|
        chef.cookbooks_path = ["chef/cookbooks", "chef/site-cookbooks"]
        chef.roles_path = "chef/roles"
        chef.nodes_path = "chef/nodes"
        chef.environments_path = "chef/environments"
        chef.data_bags_path = "chef/data_bags"
        chef.encrypted_data_bag_secret_key_path = "secrets/my_secret_key"

        chef.add_role "wca"
        chef.environment = environment
      end
    end
  end

  # Workaround for https://github.com/mitchellh/vagrant/issues/5199
  config.trigger.before [:reload, :up, :provision], stdout: true do
    environments.each do |environment|
      synced_folder = ".vagrant/machines/#{environment}/virtualbox/synced_folders"
      # Workaround for https://github.com/emyl/vagrant-triggers/issues/44
      Dir.chdir '..' while !File.exist?('Vagrantfile')
      if File.exist?(synced_folder)
        info "Deleting folder #{synced_folder}..."
        begin
          File.delete(synced_folder)
        rescue StandardError => e
          warn "Could not delete folder #{synced_folder}!"
          warn e.inspect
        end
      end
    end
  end
end
