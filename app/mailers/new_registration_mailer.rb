# frozen_string_literal: true

class NewRegistrationMailer < ApplicationMailer
  include MailersHelper

  def send_registration_mail(user)
    @user = user
    localized_mail @user.locale,
                   -> { I18n.t('users.mailer.create_new_account.header') },
                   to: user.email,
                   reply_to: 'notifications@worldcubeassociation.org'
  end
end
