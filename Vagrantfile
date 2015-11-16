Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network :forwarded_port, host: 2331, guest: 2331
  # If you choose to run MailCatcher inside the VM (defaults to port 1080),
  # you can access it via port 2332.
  config.vm.network :forwarded_port, host: 2332, guest: 1080
  config.ssh.forward_agent = true

  config.vm.provider "virtualbox" do |vb|
    # The results scripts can be a bit of a hog.
    vb.memory = 2048
  end

  # For most development, the regulations dependencies are not needed.
  config.vm.define "noregs", autostart: false do |noregs|
    noregs.vm.provision "shell" do |s|
      s.path = "scripts/wca-bootstrap.sh"
      s.args = ["development-noregs"]
    end
  end

  # A full development environment that takes a very long time to setup.
  config.vm.define "all", autostart: false do |noregs|
    noregs.vm.provision "shell" do |s|
      s.path = "scripts/wca-bootstrap.sh"
      s.args = ["development"]
    end
  end
end
