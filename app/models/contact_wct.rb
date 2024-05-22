# frozen_string_literal: true

class ContactWct < ContactForm
  attribute :message, validate: true

  def to_email
    "contact@worldcubeassociation.org"
  end

  def subject
    Time.now.strftime("[WCA Website] General Comment by #{name} on %d %b %Y at %R")
  end
end
