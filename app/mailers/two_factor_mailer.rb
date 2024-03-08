# frozen_string_literal: true

class TwoFactorMailer < ApplicationMailer
  def send_otp_to_user(user)
    @user = user
    @code = user.current_otp
    mail(
      to: @user.email,
      from: 'software@worldcubeassociation.org',
      reply_to: 'software@worldcubeassociation.org',
      subject: I18n.t('devise.sessions.new.2fa.otp_email.subject'),
    )
  end
end
