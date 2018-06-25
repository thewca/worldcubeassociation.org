# frozen_string_literal: true

class TranslationsController < ApplicationController
  before_action :authenticate_user!, except: [:index]

  def self.bad_i18n_keys
    @bad_keys ||= begin
                    english = locale_to_translation('en')
                    (I18n.available_locales - [:en]).map do |locale|
                      [locale, locale_to_translation(locale).compare_to(english)]
                    end.to_h
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
    upstream_sha = Octokit.ref(upstream_repo, "heads/master")[:object][:sha]
    Octokit.create_ref(origin_repo, "heads/#{branch_name}", upstream_sha)
    current_content_sha = Octokit.content(origin_repo, path: file_path, ref: branch_name)[:sha]
    Octokit.update_content(origin_repo, file_path, message, current_content_sha, content, branch: branch_name)
    @pr_url = Octokit.create_pull_request(upstream_repo, "master", "#{user_login}:#{branch_name}", message, pr_description_for(current_user, locale))[:html_url]
  end

  VERIFIED_TRANSLATORS_BY_LOCALE = {
    "cs" => %w(2015VAST01),
    "de" => %w(2009OHRN01),
    "es" => %w(2013MORA02 2010GARC02),
    "fi" => %w(2017NORR01),
    "fr" => %w(2008VIRO01),
    "hu" => %w(2008PLAC01),
    "it" => %w(2009COLO03 2012CANT02),
    "ja" => %w(2010TERA01),
    "ko" => %w(2008CHOI04),
    "pl" => %w(2013KOSK01),
    "pt" => %w(2014GOME07),
    "pt-BR" => %w(2007GUIM01),
    "zh-CN" => %w(2008DONG06),
    "zh-TW" => %w(2011LIUR02),
    "nl" => %w(2003BRUC01),
    "ro" => %w(2015TOMA04),
    "ru" => %w(2011GRIT01),
    "da" => %w(2013EGDA01),
    "hr" => %w(2013VIDA03),
    "sk" => %w(2015MOZO01),
    "sl" => %w(2010OMUL01),
    "id" => %w(2015HUDO01),
    "vi" => %w(2014TRUN01),
  }.freeze

  private def pr_description_for(user, locale)
    info = ["WCA Account ID: *#{user.id}*"]
    info.unshift("WCA ID: *[#{user.wca_id}](#{person_url(user.wca_id)})*") if user.wca_id
    verification_info = if VERIFIED_TRANSLATORS_BY_LOCALE[locale]&.include?(user.wca_id)
                          ":heavy_check_mark: This translation comes from a verified translator for this language."
                        else
                          ":warning: This translation doesn't come from a verified translator for this language."
                        end
    "Submitted by #{user.name} (#{info.join(', ')}).\n\n#{verification_info}"
  end
end
