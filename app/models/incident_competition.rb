# frozen_string_literal: true

class IncidentCompetition < ApplicationRecord
  belongs_to :incident
  belongs_to :competition
end
