# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionEvent do
  let(:competition) { FactoryBot.create :competition, event_ids: %w(333 444) }
  let(:competition_event) { competition.competition_events.find_by_event_id("333") }

  it "it's okay if there are no rounds yet" do
    expect(competition_event).to be_valid
  end

  context "number" do
    it "must start at 1" do
      build_rounds([3])
      expect(competition_event).to be_invalid_with_errors(rounds: ["[3] is wrong"])
    end

    it "must be contiguous" do
      build_rounds([1, 3])
      expect(competition_event).to be_invalid_with_errors(rounds: ["[1, 3] is wrong"])
    end

    it "cannot have duplicates" do
      build_rounds([1, 2, 2, 3])
      expect(competition_event).to be_invalid_with_errors(rounds: ["[1, 2, 2, 3] is wrong"])
    end

    it "cannot remove a round in the middle" do
      build_rounds([1, 2, 3])
      competition_event.save!
      expect(competition_event.rounds.length).to eq 3

      mark_rounds_for_destruction([2])
      expect(competition_event).to be_invalid_with_errors(rounds: ["[1, 3] is wrong"])
    end
  end

  def build_rounds(round_numbers)
    competition_event.rounds_attributes = round_numbers.map { |n| { number: n, format_id: "a", total_number_of_rounds: round_numbers.size } }
  end

  def mark_rounds_for_destruction(round_numbers)
    competition_event.rounds_attributes = competition_event.rounds.map do |round|
      { id: round.id, _destroy: round_numbers.include?(round.number) ? "1" : "0" }
    end
  end
end
