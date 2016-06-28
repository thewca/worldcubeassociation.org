username, repo_root = WcaHelper.get_username_and_repo_root(self)

#### Regulations dependencies
package "git"
package "python-pip"
package "fonts-unfonts-core"
package "fonts-wqy-microhei"
package "fonts-ipafont"
package "lmodern"

bash "install_wkhtmltopdf" do
  not_if "/usr/local/bin/wkhtmltopdf --version | grep -q 'with patched qt'"
  user "root"
  cwd "/tmp"
  code <<-EOH
    wget http://download.gna.org/wkhtmltopdf/0.12/0.12.3/wkhtmltox-0.12.3_linux-generic-amd64.tar.xz -O wkhtml.tar.xz
    tar -xf wkhtml.tar.xz --strip-components=1 -C /usr/local
  EOH
end

execute "pip install wrc --upgrade" do
  user "root"
end

execute "#{repo_root}/scripts/deploy.sh rebuild_regs" do
  user username
end
