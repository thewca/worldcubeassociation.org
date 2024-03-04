# frozen_string_literal: true

module UsersHelper
  ISSUER = "World Cube Association"

  def otp_provisioning_uri_for_user(user)
    user.otp_provisioning_uri("#{ISSUER}:#{user.email}", issuer: ISSUER)
  end

  def qrcode_for_user(user)
    RQRCode::QRCode.new(otp_provisioning_uri_for_user(user))
  end

  def protected_tab(id)
    @recently_authenticated ? id : "#2fa-check"
  end

  def tab_to_show(section)
    if !@recently_authenticated && %w(email password 2fa).include?(section)
      "2fa-check"
    else
      section
    end
  end
end
