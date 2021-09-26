username, repo_root = WcaHelper.get_username_and_repo_root(self)

#### Regulations dependencies
package "git"
package "python3-pip"
package "fonts-unfonts-core"
package "fonts-wqy-microhei"
package "fonts-ipafont"
package "lmodern"
package "libxrender1"

bash "install_wkhtmltopdf" do
  not_if "/usr/local/bin/wkhtmltopdf --version | grep -q 'with patched qt'"
  user "root"
  cwd "/tmp"
  code <<-EOH
    wget https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.4/wkhtmltox-0.12.4_linux-generic-amd64.tar.xz -O wkhtml.tar.xz
    tar -xf wkhtml.tar.xz --strip-components=1 -C /usr/local
  EOH
end

execute "pip3 install wrc --upgrade"

execute "#{repo_root}/scripts/deploy.sh rebuild_regs" do
  user username
end

execute "#{repo_root}/scripts/deploy.sh update_docs" do
  user username
end
