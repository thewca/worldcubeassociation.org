# frozen_string_literal: true

class DeviseMailer < Devise::Mailer
  def reset_password_instructions(record, token, opts = {})
    mail = super
    mail.subject = I18n.t("users.mailer.reset_password_instructions.subject")
    mail
  end
end
