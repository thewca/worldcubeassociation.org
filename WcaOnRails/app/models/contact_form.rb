class ContactForm < MailForm::Base
  append :remote_ip, :user_agent

  attribute :name, validate: true
  attribute :your_email, validate: :validate_your_email
  attribute :to_email, validate: :validate_to_email
  attribute :subject, validate: true

  def validate_your_email
    errors.add(:your_email, "invalid") unless ValidateEmail.valid?(your_email)
  end

  def validate_to_email
    errors.add(:to_email, "invalid") unless ValidateEmail.valid?(to_email)
  end

  def headers
    {
      subject: subject,
      to: [your_email, to_email],
      reply_to: your_email,
      from: WcaOnRails::Application.config.default_from_address,
    }
  end
end
