# frozen_string_literal: true

class RegistrationCompetitionEvent < ApplicationRecord
  belongs_to :registration, touch: true

  belongs_to :competition_event

  has_one :event, through: :competition_event
  delegate :event, to: :competition_event, allow_nil: true
end
