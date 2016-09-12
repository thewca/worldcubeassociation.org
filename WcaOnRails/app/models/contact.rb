# frozen_string_literal: true
require 'valid_email'

class Contact < MailForm::Base
  append :remote_ip, :user_agent

  attribute :name, validate: true
  attribute :message, validate: true
  attribute :your_email, validate: :valid_from_email?

  attribute :to_email, validate: :valid_to_email?
  attribute :subject, validate: true

  def valid_from_email?
    if !ValidateEmail.valid?(your_email)
      self.errors.add(:your_email, "invalid")
    end
  end

  def valid_to_email?
    if !ValidateEmail.valid?(to_email)
      self.errors.add(:to_email, "invalid")
    end
  end

  def headers
    {
      subject: subject,
      to: [ your_email, to_email ],
      reply_to: your_email,
      from: WcaOnRails::Application.config.default_from_address,
    }
  end
end
