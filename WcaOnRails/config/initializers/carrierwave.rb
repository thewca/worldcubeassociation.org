# frozen_string_literal: true

CarrierWave.configure do |config|
  config.storage = :aws

  config.asset_host = EnvConfig.S3_AVATARS_ASSET_HOST

  if Rails.env.test? || Rails.env.cucumber?
    config.enable_processing = false
  end

  config.aws_bucket = EnvConfig.S3_AVATARS_BUCKET
  config.aws_acl = 'public-read'

  aws_credentials = {
    region: EnvConfig.S3_AVATARS_REGION,
  }

  # only development needs explicit credentials to access AWS.
  # in production, access is derived implicitly through the IAM role of the machine
  unless Rails.env.production?
    if AppSecrets.AWS_ACCESS_KEY_ID.blank? || AppSecrets.AWS_SECRET_ACCESS_KEY.blank?
      aws_credentials[:stub_responses] = true
    else
      aws_credentials['access_key_id'] = AppSecrets.AWS_ACCESS_KEY_ID
      aws_credentials['secret_access_key'] = AppSecrets.AWS_SECRET_ACCESS_KEY
    end
  end

  config.aws_credentials = aws_credentials
end
