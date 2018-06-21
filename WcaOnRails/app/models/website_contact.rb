# frozen_string_literal: true

class WebsiteContact < ContactForm
  attribute :message, validate: true

  attr_accessor :inquiry
  attr_accessor :competition_id

  # Override the `to_mail` validation, to show errors for `inquiry` instead.
  def validate_to_email
    super
    if errors[:to_email].any?
      errors.add(:inquiry, I18n.t('common.errors.invalid'))
      errors.delete(:to_email)
    end
  end

  def to_email
    case inquiry
    when "competitions_in_general", "different"
      Team.wct.email
    when "wca_id_or_profile", "media"
      Team.wrt.email
    when "software"
      Team.wst.email
    when "competition"
      Competition.find_by_id(competition_id)&.managers&.map(&:email)
    else
      raise "Invalid inquiry type: `#{inquiry}`" if inquiry.present?
    end
  end
end
