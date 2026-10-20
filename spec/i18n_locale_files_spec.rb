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

RSpec.describe "Non-CLDR plural forms" do
  # Rails' i18n backend checks for a `zero` entry before consulting any plural
  # rule, so `zero:` is an exact-zero text override rather than a grammatical
  # form. CLDR does define a `zero` category, but only for languages whose
  # grammar needs one (Arabic, Welsh, Latvian), and none of ours do — so
  # tooling that normalises plurals to the target language's CLDR forms drops
  # these silently. When a string needs different wording at zero, give it its
  # own key (see `no_spots_left`) and branch on the count at the call site.
  def zero_plural_keys(node, path = [])
    return [] unless node.is_a?(Hash)

    node.flat_map do |key, value|
      key_path = path + [key]
      here = key == "zero" ? [key_path.join(".")] : []

      here + zero_plural_keys(value, key_path)
    end
  end

  Rails.root.glob("config/locales/*.yml").each do |locale_file|
    it "#{locale_file.basename} has no `zero` plural entries" do
      offenders = zero_plural_keys(YAML.unsafe_load_file(locale_file))

      expect(offenders).to be_empty
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
