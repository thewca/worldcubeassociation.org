Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network :forwarded_port, host: 2331, guest: 80
  config.ssh.forward_agent = true

  config.vm.provider "virtualbox" do |vb|
    # The results scripts can be a bit of a hog.
    vb.memory = 2048
  end

  config.vm.provision "shell" do |s|
    s.path = "scripts/wca-bootstrap.sh"
    s.args = ["development"]
  end
end
