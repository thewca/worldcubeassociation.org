# frozen_string_literal: true

class IncidentCompetition < ApplicationRecord
  belongs_to :incident
  belongs_to :competition

  validates_presence_of :incident
  validates_presence_of :competition
end
