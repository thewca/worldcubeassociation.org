# frozen_string_literal: true

module UsersHelper
  ISSUER = "World Cube Association"

  def otp_provisioning_uri_for_user(user)
    user.otp_provisioning_uri("#{ISSUER}:#{user.email}", issuer: ISSUER)
  end

  def qrcode_for_user(user)
    RQRCode::QRCode.new(otp_provisioning_uri_for_user(user))
  end
end
