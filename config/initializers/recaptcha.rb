# frozen_string_literal: true

Recaptcha.configure do |config|
  config.site_key = AppSecrets.RECAPTCHA_PUBLIC_KEY
  config.secret_key = AppSecrets.RECAPTCHA_PRIVATE_KEY
end
