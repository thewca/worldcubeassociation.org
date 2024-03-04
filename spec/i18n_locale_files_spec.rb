# frozen_string_literal: true

require 'rails_helper'
require 'i18n-spec'

RSpec.describe "Locale files content" do
  Dir.glob(Rails.root.join('config', 'locales', '*.yml')).each do |locale_file|
    describe locale_file.to_s do
      it { is_expected.to be_parseable }
      it { is_expected.to have_valid_pluralization_keys }
      it { is_expected.to_not have_missing_pluralization_keys }
      it { is_expected.to have_one_top_level_namespace }
      it { is_expected.to_not have_legacy_interpolations }
      it { is_expected.to have_a_valid_locale }
    end
  end
end

RSpec.describe "Momentjs/fullcalendar activation" do
  (I18n.available_locales - [:en]).each do |locale|
    context "for #{locale} the app/assets/javascripts/application.js file" do
      moment_content = File.read(Rails.root.join('app', 'assets', 'javascripts', 'locales', "#{locale.downcase}.js"))
      it { expect(moment_content).to include("//= require moment/#{locale.downcase}.js") }
      fc_content = File.read(Rails.root.join('app', 'assets', 'javascripts', 'fullcalendar', 'locales', "#{locale.downcase}.js"))
      it { expect(fc_content).to include("//= require fc_locales/#{locale.downcase}.js") }
    end
  end
end
