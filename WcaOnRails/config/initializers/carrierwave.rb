# frozen_string_literal: true

CarrierWave.configure do |config|
  config.storage = :aws

  config.asset_host = EnvVars.S3_AVATARS_ASSET_HOST

  if Rails.env.test? || Rails.env.cucumber?
    config.enable_processing = false
  end

  config.aws_bucket = EnvVars.S3_AVATARS_BUCKET
  config.aws_acl = 'public-read'

  aws_credentials = {
    region: EnvVars.S3_AVATARS_REGION,
    stub_responses: Rails.env.test?, # Optional, avoid hitting S3 actual during tests
  }

  # only development needs explicit credentials to access AWS.
  # in production, access is derived implicitly through the IAM role of the machine
  if Rails.env.development?
    aws_credentials['access_key_id'] = EnvVars.AWS_ACCESS_KEY_ID
    aws_credentials['secret_access_key'] = EnvVars.AWS_SECRET_ACCESS_KEY
  end

  config.aws_credentials = aws_credentials
end
