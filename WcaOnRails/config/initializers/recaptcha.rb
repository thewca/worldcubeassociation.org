# frozen_string_literal: true

Recaptcha.configure do |config|
  config.site_key = EnvVars.RECAPTCHA_PUBLIC_KEY
  config.secret_key = read_secret("RECAPTCHA_PRIVATE_KEY")
end
