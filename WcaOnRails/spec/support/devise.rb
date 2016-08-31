# frozen_string_literal: true
RSpec.configure do |config|
  config.include Devise::TestHelpers, type: :controller
  config.include Devise::TestHelpers, type: :view
end
