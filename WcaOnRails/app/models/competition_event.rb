# frozen_string_literal: true

class CompetitionEvent < ApplicationRecord
  belongs_to :competition
  belongs_to :event
  has_many :registration_competition_events, dependent: :destroy
  has_many :rounds, -> { order(:number) }, dependent: :destroy
  accepts_nested_attributes_for :rounds, allow_destroy: true

  validates_numericality_of :fee_lowest_denomination, greater_than_or_equal_to: 0
  monetize :fee_lowest_denomination,
           as: "fee",
           with_model_currency: :currency_code

  validate do
    remaining_rounds = rounds.reject(&:marked_for_destruction?)
    numbers = remaining_rounds.map(&:number).sort
    if numbers != (1..remaining_rounds.length).to_a
      errors.add(:rounds, "#{numbers} is wrong")
    end
  end

  def currency_code
    competition&.currency_code
  end

  def has_fee?
    fee.nonzero?
  end

  def event
    Event.c_find(event_id)
  end

  def to_wcif
    {
      "id" => self.event.id,
      "rounds" => self.rounds.map(&:to_wcif),
    }
  end

  def load_wcif!(wcif)
    self.rounds.destroy_all!
    total_rounds = wcif["rounds"].size
    wcif["rounds"].each_with_index do |wcif_round, index|
      self.rounds.create!(Round.wcif_to_round_attributes(wcif_round, index+1, total_rounds))
    end
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "id" => { "type" => "string" },
        "rounds" => { "type" => ["array", "null"], "items" => Round.wcif_json_schema },
        "competitorLimit" => { "type" => "integer" },
        "qualification" => { "type" => "object" }, # TODO: expand on this
      },
    }
  end
end
