# frozen_string_literal: true

if Rails.env.production?
  Shoryuken.configure_client do |config|
    config.sqs_client = Aws::SQS::Client.new(
      region: EnvConfig.DATABASE_AWS_REGION,
      credentials: Aws::ECSCredentials.new,
    )
  end

  Shoryuken.configure_server do |config|
    config.sqs_client = Aws::SQS::Client.new(
      region: EnvConfig.DATABASE_AWS_REGION,
      credentials: Aws::ECSCredentials.new,
    )
  end
end
