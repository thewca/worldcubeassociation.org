# frozen_string_literal: true

ReactOnRails.configure do |config|
  # This first slice is client-rendered only, so keep server rendering disabled.
  config.server_bundle_js_file = ""
  config.build_test_command = "RAILS_ENV=test bin/shakapacker"

  # Auto-bundling: every file directly inside app/webpacker/app gets its own
  # generated pack in app/webpacker/packs/generated, which `react_component`
  # appends to the page that mounts it. That way a page only downloads the
  # components it actually renders.
  #
  # The scan is `app/webpacker/**/app/*`, so it is deliberately shallow: files
  # nested deeper (i.e. everything under app/webpacker/components) are never
  # auto-mounted. Do not name any other directory below app/webpacker `app`.
  config.components_subdirectory = "app"
  config.auto_load_bundle = true
end
