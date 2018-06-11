# frozen_string_literal: true

class WebsiteContact < ContactForm
  attribute :message, validate: true

  attr_accessor :inquiry_target
  attr_accessor :competition_id

  # Override the `to_mail` validation, to show errors for `inquiry_target` instead.
  def validate_to_email
    super
    if errors[:to_email].any?
      errors.add(:inquiry_target, I18n.t('common.errors.invalid'))
      errors.delete(:to_email)
    end
  end
end
