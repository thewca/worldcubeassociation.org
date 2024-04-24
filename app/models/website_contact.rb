# frozen_string_literal: true

class WebsiteContact < ContactForm
  attribute :message, validate: true

  validates :inquiry, presence: true
  validates :competition_id, presence: true, if: -> { inquiry == 'competition' }

  attr_accessor :inquiry
  attr_accessor :competition_id
  attr_accessor :logged_in_email

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
    elsif inquiry == "results_team"
      return Team.wrt.email
    end

    "contact@worldcubeassociation.org"
  end

  def subject
    topic = case inquiry
            when "competition" then "Comment for #{Competition.find_by_id(competition_id)&.name}"
            when "communications_team" then "General Comment"
            when "results_team" then "Results Team Comment"
            when "software" then "Software Comment"
            else
              raise "Invalid inquiry type: `#{inquiry}`" if inquiry.present?
            end
    Time.now.strftime("[WCA Website] #{topic} by #{name} on %d %b %Y at %R")
  end
end
