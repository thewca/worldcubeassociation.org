# frozen_string_literal: true

class WebsiteContact < ContactForm
  attribute :message, validate: true

  validates :inquiry, presence: true
  validates :competition_id, presence: true, if: -> { inquiry == 'competition' }

  attr_accessor :inquiry
  attr_accessor :competition_id
  attr_accessor :logged_in_email
  attr_accessor :request_id

  # Override the `to_mail` validation, to show errors for `inquiry` instead.
  def validate_to_email
    super
    if errors[:to_email].any?
      errors.add(:inquiry, I18n.t('common.errors.invalid'))
      errors.delete(:to_email)
    end
  end

  def to_email
    if inquiry == "competition"
      competition = Competition.find_by_id(competition_id)
      if competition.present?
        return ValidateEmail.valid?(competition.contact) ? competition.contact : competition.managers.map(&:email)
      end
    elsif inquiry == UserGroup.teams_committees_group_wrt.metadata.friendly_id
      return UserGroup.teams_committees_group_wrt.metadata.email
    end

    "contact@worldcubeassociation.org"
  end

  def subject
    topic = case inquiry
            when "competition" then "Comment for #{Competition.find_by_id(competition_id)&.name}"
            when UserGroup.teams_committees_group_wct.metadata.friendly_id then "General Comment"
            when UserGroup.teams_committees_group_wrt.metadata.friendly_id then "Results Team Comment"
            when UserGroup.teams_committees_group_wst.metadata.friendly_id then "Software Comment"
            else
              raise "Invalid inquiry type: `#{inquiry}`" if inquiry.present?
            end
    Time.now.strftime("[WCA Website] #{topic} by #{name} on %d %b %Y at %R")
  end
end
