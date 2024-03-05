# frozen_string_literal: true

Devise.setup do |config|
  # Set the allowed time frame for server-generated one-time passwords (ie: those
  # sent by emails).
  config.otp_allowed_drift = 120
end
