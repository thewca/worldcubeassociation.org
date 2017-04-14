# frozen_string_literal: true

RSpec.configure do |config|
  config.after(:each) do
    I18n.locale = :en
  end
end
