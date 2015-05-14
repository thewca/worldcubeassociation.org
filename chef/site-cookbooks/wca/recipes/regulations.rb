#### Regulations dependencies
# Dependencies for wca-documents-extra. Some of this came from
# https://github.com/cubing/wca-documents-extra/blob/master/.travis.yml, but has
# been tweaked for Ubuntu 14.04
package "git"
package "texlive-fonts-recommended"
package "pandoc"
package "fonts-unfonts-core"
package "fonts-arphic-uming"
package "texlive-lang-all" do
  # This package takes *forever* to install. Give it an hour.
  timeout 60*60
end
package "texlive-xetex"
package "texlive-latex-recommended"
package "texlive-latex-extra"
package "lmodern"

# copied from default.rb
vagrant_user = node['etc']['passwd']['vagrant']
if vagrant_user
  username = "vagrant"
  repo_root = "/vagrant"
else
  username = "cubing"
  repo_root = "/home/#{username}/worldcubeassociation.org"
end

execute "#{repo_root}/scripts/regulations.sh rebuild" do
  user username
  not_if "ls #{repo_root}/webroot/regulations"
end
