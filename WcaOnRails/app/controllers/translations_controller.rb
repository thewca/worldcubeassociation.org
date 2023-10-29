# frozen_string_literal: true

class TranslationsController < ApplicationController
  before_action :authenticate_user!, except: [:index]

  def self.bad_i18n_keys
    @bad_keys ||= begin
      english = locale_to_translation('en')
      (I18n.available_locales - [:en]).to_h do |locale|
        [locale, locale_to_translation(locale).compare_to(english)]
      end
    end
  end

  def self.locale_to_translation(locale)
    locale = locale.to_s
    filename = Rails.root.join('config', 'locales', "#{locale}.yml")
    WcaI18n::Translation.new(locale, File.read(filename))
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
    # We create a branch pointing to upstream master SHA. This stopped working
    # unless the commit exists in the fork repository, so we always sync first.
    # Octokit doesn't expost a method for this, so we make a regular request.
    RestClient.post("https://api.github.com/repos/#{origin_repo}/merge-upstream", '{"branch":"master"}', {
                      accept: "application/vnd.github+json",
                      authorization: "Bearer #{AppSecrets.GITHUB_CREATE_PR_ACCESS_TOKEN}",
                      x_github_api_version: "2022-11-28",
                    })
    upstream_sha = Octokit.ref(upstream_repo, "heads/master")[:object][:sha]
    Octokit.create_ref(origin_repo, "heads/#{branch_name}", upstream_sha)
    current_content_sha = Octokit.content(origin_repo, path: file_path, ref: branch_name)[:sha]
    Octokit.update_content(origin_repo, file_path, message, current_content_sha, content, branch: branch_name)
    @pr_url = Octokit.create_pull_request(upstream_repo, "master", "#{user_login}:#{branch_name}", message, pr_description_for(current_user, locale))[:html_url]
  end

  # rubocop:disable Style/NumericLiterals
  VERIFIED_TRANSLATORS_BY_LOCALE = {
    "ca" => [94007, 15295],
    "cs" => [8583],
    "da" => [6777],
    "de" => [870, 7121, 7139],
    "eo" => [1517],
    "es" => [7340, 1439],
    "fi" => [39072],
    "fr" => [277],
    "hr" => [46],
    "hu" => [368],
    "id" => [1285],
    "it" => [19667],
    "ja" => [32229, 1118],
    "kk" => [201680],
    "ko" => [14],
    "nl" => [1, 41519],
    "pl" => [6008, 1686],
    "pt" => [331],
    "pt-BR" => [18],
    "ro" => [11918],
    "ru" => [140, 1492],
    "sk" => [7922],
    "sl" => [1381],
    "sv" => [17503],
    "th" => [21095],
    "uk" => [296],
    "vi" => [7158],
    "zh-CN" => [9],
    "zh-TW" => [38, 77608],
  }.freeze
  # rubocop:enable Style/NumericLiterals

  private def pr_description_for(user, locale)
    info = ["WCA Account ID: *#{user.id}*"]
    info.unshift("WCA ID: *[#{user.wca_id}](#{person_url(user.wca_id)})*") if user.wca_id
    verification_info = if VERIFIED_TRANSLATORS_BY_LOCALE[locale]&.include?(user.id)
                          ":heavy_check_mark: This translation comes from a verified translator for this language."
                        else
                          ":warning: This translation doesn't come from a verified translator for this language."
                        end
    "Submitted by #{user.name} (#{info.join(', ')}).\n\n#{verification_info}"
  end
end
