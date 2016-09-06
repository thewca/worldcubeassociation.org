# frozen_string_literal: true
CarrierWave.configure do |config|
  config.storage = :file
  # From http://stackoverflow.com/a/32463067
  if Rails.application.config.action_controller.asset_host
    config.asset_host = Rails.application.config.action_controller.asset_host
  elsif Rails.env.test?
    # Only set asset_host for tests, which expect carrierwave to return full
    # paths to images. In development, we want relative paths so running behind
    # nginx inside of Vagrant will work.
    config.asset_host = "http://example.com"
  end
  if Rails.env.test? or Rails.env.cucumber?
    config.enable_processing = false
  end
end
