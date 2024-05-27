# frozen_string_literal: true

class ContactCompetition < ContactForm
  attribute :message, validate: true

  validates :competition_id, presence: true

  attr_accessor :competition_id

  def to_email
    competition = Competition.find_by_id(competition_id)
    if competition.present?
      ValidateEmail.valid?(competition.contact) ? competition.contact : competition.managers.map(&:email)
    else
      "contact@worldcubeassociation.org"
    end
  end

  def subject
    Time.now.strftime("[WCA Website] Comment for #{Competition.find_by_id(competition_id)&.name} by #{name} on %d %b %Y at %R")
  end
end
