require 'minitest/spec'

# Cookbook name:: tarsnap
# Spec:: default

describe_recipe 'tarsnap::default' do
  describe 'ensures tarsnap is installed' do
    let(:binary) { file("#{node['tarsnap']['bin_path']}/tarsnap") }
    it { binary.must_have(:mode, "0755") }
    it { binary.must_have(:owner, "root") }
  end

  describe 'ensures tarsnap.conf config is present' do
    let(:config) { file("#{node['tarsnap']['conf_dir']}/tarsnap.conf") }
    it { config.must_have(:mode, "0644") }
    it { config.must_have(:owner, "root") }
    it { config.must_include 'keyfile /root/tarsnap.key' }
  end

  describe "ensures cache dir is present" do
    let(:cachedir) { directory(node['tarsnap']['cachedir']) }
    it { cachedir.must_have(:mode, "0700") }
    it { cachedir.must_have(:owner, "root") }
  end

  describe 'ensures feather is installed' do
    let(:binary) { file("#{node['tarsnap']['bin_path']}/feather") }
    it { binary.must_have(:mode, "0755") }
    it { binary.must_have(:owner, "root") }
  end

  describe 'ensures feather.yaml config is present' do
    let(:config) { file("#{node['tarsnap']['conf_dir']}/feather.yaml") }
    it { config.must_have(:mode, "0644") }
    it { config.must_have(:owner, "root") }
    it { config.must_include 'schedule:' }
  end

  it "ensures crontab is present" do
    cron("feather").must_exist.with(:hour, "*").and(:minute, "*/5")
  end

  it "can run tarsnap" do
    result = assert_sh("LANG=C tarsnap --version || true")
    assert_includes result, "tarsnap #{node['tarsnap']['version']}"
  end

  it "can run feather" do
    result = assert_sh("feather --help")
    assert_includes result, "Usage: feather"
  end
end
