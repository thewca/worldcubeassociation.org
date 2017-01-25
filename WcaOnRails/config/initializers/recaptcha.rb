# frozen_string_literal: true
Recaptcha.configure do |config|
  config.site_key = ENVied.RECAPTCHA_PUBLIC_KEY
  config.secret_key = ENVied.RECAPTCHA_PRIVATE_KEY
end
