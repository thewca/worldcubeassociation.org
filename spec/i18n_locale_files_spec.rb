# frozen_string_literal: true

require 'rails_helper'
require 'i18n-spec'

RSpec.describe "Locale files content" do
  Rails.root.glob("config/locales/*.yml").each do |locale_file|
    describe locale_file.to_s do
      it { is_expected.to be_parseable }
      it { is_expected.to have_valid_pluralization_keys }
      it { is_expected.not_to have_missing_pluralization_keys }
      it { is_expected.to have_one_top_level_namespace }
      it { is_expected.not_to have_legacy_interpolations }
      it { is_expected.to have_a_valid_locale }
    end
  end
end

RSpec.describe "Momentjs activation" do
  locale_mappings = { "es-es" => "es", "es-419" => "es-mx" }

  (I18n.available_locales - [:en]).each do |locale|
    context "for #{locale} the app/assets/javascripts/application.js file" do
      locale = locale.to_s.downcase
      mapped_locale = locale_mappings[locale] || locale
      moment_content = Rails.root.join('app', 'assets', 'javascripts', 'locales', "#{locale.downcase}.js").read

      it { expect(moment_content).to include("//= require moment/#{mapped_locale}.js") }
    end
  end
end
