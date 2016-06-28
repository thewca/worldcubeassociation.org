Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network :forwarded_port, host: 2331, guest: 2331
  # Mailcatcher runs on port 1080 inside the VM.
  config.vm.network :forwarded_port, host: 2332, guest: 1080
  config.ssh.forward_agent = true

  config.vm.provider "virtualbox" do |vb|
    # The results scripts can be a bit of a hog.
    vb.memory = 2048
  end

  # A full development environment
  config.vm.define "all", autostart: false do |all|
    all.vm.provision "shell" do |s|
      s.path = "scripts/wca-bootstrap.sh"
      s.args = ["development"]
    end
  end
end
