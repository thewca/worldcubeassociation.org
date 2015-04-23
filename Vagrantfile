Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network :forwarded_port, host: 8080, guest: 80

  config.vm.provision "results", type: "shell" do |s|
    s.inline = "/vagrant/scripts/results.sh install_deps rebuild"
  end
  config.vm.provision "regulations", type: "shell" do |s|
    s.inline = "/vagrant/scripts/regulations.sh install_deps rebuild"
  end
  config.vm.provision "results-rails", type: "shell" do |s|
    s.inline = "/vagrant/scripts/results-rails.sh install_deps rebuild"
  end

  # The results scripts can be a bit of a hog.
  config.vm.provider "virtualbox" do |vb|
    vb.memory = 2048
  end
end
