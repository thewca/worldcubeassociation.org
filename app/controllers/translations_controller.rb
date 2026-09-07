# frozen_string_literal: true

class TranslationsController < ApplicationController
  before_action :authenticate_user!, except: [:index]

  def self.compute_bad_i18n_keys
    base_locales = AvailableLocales::ALL.transform_values { it[:base_locale] || 'en' }
    memo = {}

    (I18n.available_locales - [:en]).index_with do |locale|
      effective_bad_i18n_keys(locale, base_locales, memo)
    end
  end

  # Bad keys for `locale` relative to its base, unioned with the base locale's
  # own (chain-resolved) bad keys. This way e.g. fr-CA inherits anything fr is
  # still missing/outdated against en, instead of stopping at the direct fr diff.
  def self.effective_bad_i18n_keys(locale, base_locales, memo)
    locale = locale.to_sym
    memo[locale] ||= begin
      base_locale = (base_locales[locale] || 'en').to_sym
      direct = locale_to_translation(locale).compare_to(locale_to_translation(base_locale))

      if base_locale == :en
        direct
      else
        merge_bad_i18n_keys(direct, effective_bad_i18n_keys(base_locale, base_locales, memo))
      end
    end
  end

  # Union per type (:missing / :unused / :outdated). Values are arrays of
  # path-segment arrays; Array#| dedups them by value.
  def self.merge_bad_i18n_keys(*key_hashes)
    key_hashes.each_with_object({}) do |key_hash, merged|
      key_hash.each { |type, keys| merged[type] = (merged[type] || []) | keys }
    end
  end

  def self.locale_to_translation(locale)
    locale = locale.to_s
    filename = Rails.root.join('config', 'locales', "#{locale}.yml")
    WcaI18n::Translation.new(locale, File.read(filename))
  end

  BAD_I18N_KEYS = self.compute_bad_i18n_keys

  def index
    @bad_i18n_keys = TranslationsController::BAD_I18N_KEYS
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
    file_path = "config/locales/#{locale}.yml"
    message = "Update #{locale} translation."
    content_digest = Digest::SHA1.hexdigest(content)
    branch_name = "translation-#{locale}-#{content_digest}"
    # We create a branch pointing to upstream main SHA. This stopped working
    # unless the commit exists in the fork repository, so we always sync first.
    # Octokit doesn't expose a direct method for this, so we make a custom request.
    Octokit.client.post("#{Octokit::Repository.path(origin_repo)}/merge-upstream", { branch: "main" })
    upstream_sha = Octokit.ref(upstream_repo, "heads/main")[:object][:sha]
    Octokit.create_ref(origin_repo, "heads/#{branch_name}", upstream_sha)
    current_content_sha = Octokit.content(origin_repo, path: file_path, ref: branch_name)[:sha]
    Octokit.update_content(origin_repo, file_path, message, current_content_sha, content, branch: branch_name)
    @pr_url = Octokit.create_pull_request(upstream_repo, "main", "#{user_login}:#{branch_name}", message, pr_description_for(current_user, locale))[:html_url]
  end

  private def pr_description_for(user, locale)
    info = ["WCA Account ID: *#{user.id}*"]
    info.unshift("WCA ID: *[#{user.wca_id}](#{person_url(user.wca_id)})*") if user.wca_id
    is_verified_translator = false
    UserGroup.translators.each do |translators_group|
      if translators_group.roles.any? { |role| role.user_id == user.id && role.group.metadata.locale == locale }
        is_verified_translator = true
        break
      end
    end
    verification_info = if is_verified_translator
                          ":heavy_check_mark: This translation comes from a verified translator for this language."
                        else
                          ":warning: This translation doesn't come from a verified translator for this language."
                        end
    "Submitted by #{user.name} (#{info.join(', ')}).\n\n#{verification_info}"
  end
end
