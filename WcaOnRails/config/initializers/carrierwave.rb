# frozen_string_literal: true

CarrierWave.configure do |config|
  config.storage = :file

  config.asset_host = ENVied.ROOT_URL

  if Rails.env.test? || Rails.env.cucumber?
    config.enable_processing = false
  end
end
