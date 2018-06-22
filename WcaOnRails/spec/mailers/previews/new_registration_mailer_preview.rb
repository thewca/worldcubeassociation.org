# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/new_registration_mailer
class NewRegistrationMailerPreview < ActionMailer::Preview
  def send_registration_mail
    user = User.where.not(confirmed_at: nil).first
    NewRegistrationMailer.send_registration_mail(user)
  end
end
