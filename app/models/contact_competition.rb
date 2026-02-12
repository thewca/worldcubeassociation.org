# frozen_string_literal: true

class ContactCompetition < ContactForm
  attribute :message, validate: true

  validates :competition_id, presence: true

  attr_accessor :competition_id

  delegate :url, to: :competition, prefix: true, allow_nil: true

  def competition
    @competition ||= Competition.find_by(id: competition_id)
  end

  def to_email
    if competition.present?
      ValidateEmail.valid?(competition.contact) ? competition.contact : competition.managers.map(&:email)
    else
      "contact@worldcubeassociation.org"
    end
  end

  def subject
    Time.now.strftime("[WCA Website] Comment for #{competition&.name} by #{name} on %d %b %Y at %R")
  end
end
