# frozen_string_literal: true
class GitHubController < ApplicationController
  before_action :authenticate_user!

  def edit_translation
  end

  def update_translation
    content = params[:translation][:content].delete("\r") # We don't want \r characters, but browsers add them automatically.
    locale = params[:translation][:locale]
    if [locale, content].any?(&:blank?)
      flash[:danger] = "Both locale and content must be present."
      render :edit_translation
      return
    end
    user_login = Octokit.user.login
    origin_repo = "#{user_login}/worldcubeassociation.org"
    upstream_repo = "thewca/worldcubeassociation.org"
    file_path = "WcaOnRails/config/locales/#{locale}.yml"
    message = "Update #{locale} translation."
    content_digest = Digest::SHA1.hexdigest(content)
    branch_name = "translation-#{locale}-#{content_digest}"
    upstream_sha = Octokit.ref(upstream_repo, "heads/master")[:object][:sha]
    Octokit.create_ref(origin_repo, "heads/#{branch_name}", upstream_sha)
    current_content_sha = Octokit.content(origin_repo, path: file_path, ref: branch_name)[:sha]
    Octokit.update_content(origin_repo, file_path, message, current_content_sha, content, branch: branch_name)
    @pr_url = Octokit.create_pull_request(upstream_repo, "master", "#{user_login}:#{branch_name}",
                                          message, "Submitted by #{current_user.name}.")[:html_url]
  end
end
