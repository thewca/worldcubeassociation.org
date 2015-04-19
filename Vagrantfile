Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.provision :shell, path: "bootstrap.sh"
  config.vm.network :forwarded_port, host: 8080, guest: 80

  # Apache runs as www-data, and needs write permission to some folders.
  # See http://stackoverflow.com/a/19024922 for why we don't just chmod as part
  # of bootstrap.sh.
  config.vm.synced_folder "./", "/vagrant", owner: 'www-data', group: 'vagrant'

  # The results scripts can be a bit of a hog.
  config.vm.provider "virtualbox" do |v|
      v.memory = 2048
  end
end
