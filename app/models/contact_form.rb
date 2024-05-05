# frozen_string_literal: true

class ContactForm < MailForm::Base
  append :remote_ip, :user_agent

  attribute :name, validate: true
  attribute :your_email, validate: :validate_your_email
  attribute :to_email, validate: :validate_to_email
  attribute :subject, validate: true

  attr_accessor :logged_in_email

  def validate_your_email
    errors.add(:your_email, I18n.t('common.errors.invalid')) unless ValidateEmail.valid?(your_email)
  end

  def validate_to_email
    # Handle both email string and an array of those.
    if to_email.blank? || Array(to_email).any? { |email| !ValidateEmail.valid?(email) }
      errors.add(:to_email, I18n.t('common.errors.invalid'))
    end
  end

  def headers
    {
      subject: subject,
      to: [your_email, to_email].flatten,
      reply_to: your_email,
      from: WcaOnRails::Application.config.default_from_address,
    }
  end
end
