CarrierWave.configure do |config|
  config.storage = :file
  # From http://stackoverflow.com/a/32463067
  config.asset_host = ActionDispatch::Http::URL.url_for(ActionMailer::Base.default_url_options)
  if Rails.env.test? or Rails.env.cucumber?
    config.enable_processing = false
  end
end
