# frozen_string_literal: true

RSpec.configure do |config|
  config.after(:each) do
    # rubocop:disable Rails/I18nLocaleAssignment
    I18n.locale = :en
    # rubocop:enable Rails/I18nLocaleAssignment
  end
end
