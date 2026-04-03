# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LinkedRound do
  it "final_round? returns true for Dual Rounds with round 1 + 2 of 2" do
    c = create(:competition)
    l = create(:linked_round)
    create(:round, event_id: "333", competition: c, linked_round_id: l.id, total_number_of_rounds: 2, number: 1)
    create(:round, event_id: "333", competition: c, linked_round_id: l.id, total_number_of_rounds: 2, number: 2)

    expect(l.reload).to be_final_round
  end

  it "final_round? returns false for Dual Rounds with round 1 + 2 of 3" do
    c = create(:competition)
    l = create(:linked_round)
    create(:round, event_id: "333", competition: c, linked_round_id: l.id, total_number_of_rounds: 3, number: 1)
    create(:round, event_id: "333", competition: c, linked_round_id: l.id, total_number_of_rounds: 3, number: 2)

    expect(l.reload).not_to be_final_round
  end
end
