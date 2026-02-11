# frozen_string_literal: true

class ContactCompetition < ContactForm
  attribute :message, validate: true

  validates :competition_id, presence: true

  attr_accessor :competition_id

  def to_email
    competition = Competition.find_by(id: competition_id)
    if competition.present?
      ValidateEmail.valid?(competition.contact) ? competition.contact : competition.managers.map(&:email)
    else
      "contact@worldcubeassociation.org"
    end
  end

  def subject
    Time.now.strftime("[WCA Website] Comment for #{Competition.find_by(id: competition_id)&.name} by #{name} on %d %b %Y at %R")
  end

  def competition_url
    competition = Competition.find_by(id: competition_id)
    return nil unless competition.present?

    Rails.application.routes.url_helpers.competition_url(competition, host: EnvConfig.ROOT_URL)
  end
end
