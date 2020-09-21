# worldcubeassociation.org [![Build Status](https://travis-ci.org/thewca/worldcubeassociation.org.svg?branch=master)](https://travis-ci.org/thewca/worldcubeassociation.org) [![Coverage Status](https://coveralls.io/repos/github/thewca/worldcubeassociation.org/badge.svg?branch=master)](https://coveralls.io/github/thewca/worldcubeassociation.org?branch=master)

本仓库包含所有运行在 [worldcubeassociation.org](https://www.worldcubeassociation.org/) 上的代码

## 配置安装 

- 克隆并定位到本地仓库
  ```
  git clone https://github.com/thewca/worldcubeassociation.org
  cd worldcubeassociation.org
  ```
  
- 确保你安装了正确的 [Ruby version](./.ruby-version)  版本.我们推荐使用 Ruby 版本安装器，例如 [rvm](https://rvm.io/rvm/install) 或者  [rbenv](https://github.com/rbenv/rbenv). 它们会通过读取 `.ruby-version` 来安装正确的版本（执行指令`rvm current` 或 `rbenv version` 来查看安装的版本）

- 确保安装了  [Bundler 2](https://bundler.io/v2.0/guides/bundler_2_upgrade.html)

  - 从 bundler 1 升级：
    
    ```
    gem update --system
    bundle update --bundler
    ```
    
  - 如果你之前尚未安装过 bundler：
    
    ```
    gem update --system
    gem install bundler
    ```

- 配置 git pre-commit 钩子（非必须步骤，但是非常有用）
  
  ```shell
  (cd WcaOnRails; bundle install && bin/yarn && bundle exec overcommit --install)
  ```
  日后如果修改了 hook，则必须从本地仓库的根目录运行此命令来更新它：
  
  `BUNDLE_GEMFILE=WcaOnRails/Gemfile bundle exec overcommit --sign`.
  
  

### 通过 Ruby 来自动运行（轻量级的选择方式，但是只运行网站中的 Rails 部分）

- 安装 [MySQL 8.0](https://dev.mysql.com/doc/refman/8.0/en/linux-installation.html)，并设置 root 用户密码为空。如果有毛病，尝试下列的代码：
  
  ```shell
  # Run MySQL CLI as administrator and set an empty password for the root user:
  sudo mysql -u root
  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
  ```
  
- 安装依赖库并加载开发环境数据库
  
  1. `cd WcaOnRails/`
  
  2. 安装 [Node.js](https://nodejs.org/en/)  和 [yarn](https://yarnpkg.com/en/docs/install) 以执行项目里的 javascript 部分代码
  
    可以参考我们的 [chef recipe](https://github.com/thewca/worldcubeassociation.org/blob/master/chef/site-cookbooks/wca/recipes/default.rb#L6-L23) 来查看网站所使用的具体版本以及安装方法
  
    请注意，其他版本也可以使用，但无法保证
  
  3. `bundle install && bin/yarn`
  
  4. `bin/rake db:load:development` - 下载并且导入 [developer's database export](https://github.com/thewca/worldcubeassociation.org/wiki/Developer-database-export). 这取决于你的计算机，它或许需要花费很长时间。或者你可以运行 `bin/rake db:reset`  来创建数据库以及往数据库里填充初始随机数据（这个途径更快，但是随机生成的数据可能不那么具有代表性）
  
  5. `bin/rails server` - 运行 Rails. 可以通过 localhost:3000 访问网站
  
- 运行测试脚本。脚本会根据 `.travis.yml`中的 `before_script`  部分来进行配置
  
  1. `RAILS_ENV=test bin/rake db:reset` —— 配置测试数据库
  2. `RAILS_ENV=test bin/rake assets:precompile` —— 编译一些测试运行所需要的文件
  3. `bin/rspec` ——运行测试
  
- [Mailcatcher](http://mailcatcher.me/) is a good tool for catching emails in development.

  

### 在 Vagrant 中运行（可以完整地运行网站，但速度很慢，只有当需要执行网站的 PHP 部分时才考虑用这个方法）

- 安装 [Vagrant](https://www.vagrantup.com/)，需要先安装 [VirtualBox](https://www.virtualbox.org/)
- `vagrant up all`—— 虚拟机启动完毕后（可能得花点时间），就可以通过 [http://localhost:2331](http://localhost:2331) 来访问网站了
  - 注意：在 Windows 上进行开发可能会遇到一些小问题。具体请参见 [issues with development on Windows](https://github.com/thewca/worldcubeassociation.org/issues/393).
- 可以访问 `http://localhost:2332` 来查看邮件
- 请看一看我们的维基 [wiki page](https://github.com/thewca/worldcubeassociation.org/wiki/Misc.-important-commands-to-know) 来获取软件的内部详细信息



## 项目部署与上线

请参见 [Spinning up a new server](https://github.com/thewca/worldcubeassociation.org/wiki/Spinning-up-a-new-server) 和 [Merging and deploying](https://github.com/thewca/worldcubeassociation.org/wiki/Merging-and-deploying).