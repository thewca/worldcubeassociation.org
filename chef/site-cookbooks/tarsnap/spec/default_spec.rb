require 'chefspec'

class ChefSpec::ChefRunner
  def append(recipe)
    runner = Chef::Runner.new(recipe.run_context)
    runner.converge
    self
  end
end

def fake_recipe(run, &block)
  recipe = Chef::Recipe.new("tarsnap_spec", "default", run.run_context)
  recipe.instance_eval(&block)
end

run_options = {
  :step_into => [ 'tarsnap_backup', 'tarsnap_schedule' ]
}

describe 'tarsnap::default' do

  let(:runner) do
    ChefSpec::ChefRunner.new(run_options) do |node|
      node.automatic_attrs['platform'] = 'debian'
      node.automatic_attrs['platform_version'] = '7.0'
      node.set['tarsnap']['install_packages'] = [ 'source_dependency' ]
    end
  end
  let(:chef_run) do
    runner.converge 'tarsnap::default'
  end

  context 'configured to install from source' do
    it "installs the build packages" do
      chef_run.should install_package 'source_dependency'
    end
  end

  context 'configured to install a package' do
    context "on FreeBSD" do
      let(:freebsd) do
        ChefSpec::ChefRunner.new(run_options) do |node|
          node.automatic_attrs['platform'] = 'freebsd'
          node.automatic_attrs['platform_version'] = '9.0'
        end
      end
      let(:freebsd_run) do
        freebsd.converge 'tarsnap::default'
      end
      it "installs the package" do
        freebsd_run.should install_package 'tarsnap'
      end
    end
  end

  context "manages a feather.yml configuration" do
    let(:run) do
      recipe = fake_recipe(chef_run) do
        tarsnap_backup 'configs' do
          path [ '/etc' ]
          schedule 'daily'
        end
      end
      chef_run.append(recipe)
    end

    it "creates the correct backup directory configuration" do
      run.should create_file_with_content "/etc/feather.yaml",
        [ "backups:",
          "- configs:",
          "  - schedule: daily",
          "  - path:",
          "    - /etc"
        ].join("\n")
    end

    it "includes the default schedule configuration" do
      run.should create_file_with_content "/etc/feather.yaml",
        [ "schedule:",
          "- monthly:",
          "  - period: 2592000",
          "  - always_keep: 12",
          "  - before: '0600'",
          "- weekly:",
          "  - period: 604800",
          "  - always_keep: 6",
          "  - after: '0200'",
          "  - before: '0600'",
          "  - implies: monthly",
          "- daily:",
          "  - period: 86400",
          "  - always_keep: 14",
          "  - after: '0200'",
          "  - before: '0600'",
          "  - implies: weekly",
          "- hourly:",
          "  - period: 3600",
          "  - always_keep: 24",
          "  - implies: daily",
          "- realtime:",
          "  - period: 900",
          "  - always_keep: 10",
          "  - implies: hourly",
        ].join("\n")
    end
  end

  context "when a key isn't available" do
    it "sets a tarsnap_pending attribute on the node" do
      pending
    end
  end

  context "when a key is available" do
    it "clears the tarsnap_pending attribute on the node" do
      pending
    end
    it "creates a tarsnap keyfile" do
      pending
    end
  end

end
