# frozen_string_literal: true
class CompetitionEvent < ActiveRecord::Base
  belongs_to :competition
  belongs_to :event
  has_many :registration_competition_events, dependent: :destroy
end
