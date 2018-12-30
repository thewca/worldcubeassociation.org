# frozen_string_literal: true

require 'i18n/tasks'

RSpec.describe 'I18n' do
  let(:i18n) { I18n::Tasks::BaseTask.new }
  let(:missing_keys) { i18n.missing_keys(locales: [:en]) }
  let(:unused_keys) { i18n.unused_keys(locales: [:en]) }

  it 'does not have missing keys' do
    expect(missing_keys).to be_empty, "Missing #{missing_keys.leaves.count} i18n keys\n#{missing_keys.inspect}\nYou can also run `i18n-tasks missing -l en' to show them"
  end

  it 'does not have unused keys' do
    expect(unused_keys).to be_empty, "#{unused_keys.leaves.count} unused i18n keys\n#{unused_keys.inspect}\nYou can also run `i18n-tasks unused -l en' to show them"
  end

  I18n.available_locales.each do |locale|
    it "#{locale} defines time_format correctly" do
      time_format = I18n.translate("common.time_format", locale: locale, default: nil)
      allowed_values = [
        "12h",
        "24h",

        # It's ok if the translation doesn't define a value for time_format, because
        # we'll fall back to the English setting.
        nil,
      ]
      expect(allowed_values).to include time_format
    end
  end
end
