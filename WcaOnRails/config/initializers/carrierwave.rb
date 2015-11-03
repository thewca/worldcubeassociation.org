CarrierWave.configure do |config|
  config.storage = :file
  # From http://stackoverflow.com/a/32463067
  if Rails.application.config.action_controller.asset_host
    config.asset_host = Rails.application.config.action_controller.asset_host
  else
    config.asset_host = ActionDispatch::Http::URL.url_for(ActionMailer::Base.default_url_options)
  end
  if Rails.env.test? or Rails.env.cucumber?
    config.enable_processing = false
  end
end
