# frozen_string_literal: true
class TranslationsStatusController < ApplicationController
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
end
