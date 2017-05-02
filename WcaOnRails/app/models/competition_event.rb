# frozen_string_literal: true

class CompetitionEvent < ApplicationRecord
  belongs_to :competition
  belongs_to :event
  has_many :registration_competition_events, dependent: :destroy
  has_many :rounds, -> { order(:number) }
  accepts_nested_attributes_for :rounds, allow_destroy: true

  validate do
    remaining_rounds = rounds.reject(&:marked_for_destruction?)
    numbers = remaining_rounds.map(&:number).sort
    if numbers != (1..remaining_rounds.length).to_a
      errors.add(:rounds, "#{numbers} is wrong")
    end
  end

  def to_wcif
    {
      "id" => self.event.id,
      "rounds" => self.rounds.map(&:to_wcif),
    }
  end
end
