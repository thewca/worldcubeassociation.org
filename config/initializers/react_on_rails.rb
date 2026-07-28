# frozen_string_literal: true

ReactOnRails.configure do |config|
  # This first slice is client-rendered only, so keep server rendering disabled.
  config.server_bundle_js_file = ""
  config.build_test_command = "RAILS_ENV=test bin/shakapacker"

  # Auto-bundling: every file in an `ror_components` directory below
  # app/webpacker gets its own generated pack in app/webpacker/packs/generated,
  # which `react_component` appends to the page that mounts it. That way a page
  # only downloads the components it actually renders.
  config.components_subdirectory = "ror_components"
  config.auto_load_bundle = true
end
