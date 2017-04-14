# frozen_string_literal: true

class TranslationsController < ApplicationController
  before_action :authenticate_user!, except: [:index]

  def self.bad_i18n_keys
    @bad_keys ||= (I18n.available_locales - [:en]).each_with_object({}) do |locale, hash|
      ref_english = Locale.new('en')
      missing, unused, outdated = Locale.new(locale, true).compare_to(ref_english)
      hash[locale] = { missing: missing, unused: unused, outdated: outdated }
    end
  end

  def index
    @bad_i18n_keys = self.class.bad_i18n_keys
    bad_keys = @bad_i18n_keys.values.map(&:values).flatten
    @all_translations_perfect = bad_keys.empty?
  end

  def edit
  end

  def update
    content = params[:translation][:content].delete("\r") # We don't want \r characters, but browsers add them automatically.
    locale = params[:translation][:locale]
    if [locale, content].any?(&:blank?)
      flash.now[:danger] = "Both locale and content must be present."
      render :edit
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
    @pr_url = Octokit.create_pull_request(upstream_repo, "master", "#{user_login}:#{branch_name}", message, pr_description_for(current_user))[:html_url]
  end

  private def pr_description_for(user)
    info = ["WCA Account ID: *#{user.id}*"]
    info.unshift("WCA ID: *#{user.wca_id}*") if user.wca_id
    "Submitted by #{user.name} (#{info.join(', ')})."
  end
end
