# frozen_string_literal: true

ReactOnRails.configure do |config|
  # This first slice is client-rendered only, so keep server rendering disabled.
  config.server_bundle_js_file = ""
  config.build_test_command = "RAILS_ENV=test bin/shakapacker"
end
