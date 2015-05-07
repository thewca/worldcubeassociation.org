Recaptcha.configure do |config|
  config.public_key = ENVied.RECAPTCHA_PUBLIC_KEY
  config.private_key = ENVied.RECAPTCHA_PRIVATE_KEY
end
